/**
 * Index Manager for OpenCode Memory Plugin
 * 
 * Provides intelligent index management with:
 * - File hash detection for change tracking
 * - Debouncing to avoid frequent rebuilds
 * - Batch update queue for efficient processing
 * - Incremental updates
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getVectorStore } from './vector-store.js';
import { getMemoryFiles, getMemoryDir } from './memory-files.js';

const MEMORY_DIR = getMemoryDir();
const HASH_FILE = path.join(MEMORY_DIR, '.index-hashes.json');
const CONFIG_FILE = path.join(MEMORY_DIR, 'memory-config.json');

// Default debounce delay (ms)
const DEFAULT_DEBOUNCE_DELAY = 1000;

/**
 * IndexManager class for managing vector index updates
 */
export class IndexManager {
  constructor() {
    this.hashCache = new Map();
    this.updateQueue = [];
    this.debounceTimer = null;
    this.isProcessing = false;
    this.config = null;
    this.loadHashCache();
  }

  /**
   * Get configuration
   */
  getConfig() {
    if (this.config) return this.config;
    
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = JSON.parse(content);
      }
    } catch (e) {
      // Ignore errors
    }
    
    this.config = this.config || {
      indexing: {
        autoUpdate: true,
        debounceDelay: DEFAULT_DEBOUNCE_DELAY,
        batchSize: 10
      }
    };
    return this.config;
  }

  /**
   * Calculate file hash
   * @param {string} filePath - Path to file
   * @returns {string} MD5 hash of file content
   */
  calculateFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (e) {
      return null;
    }
  }

  /**
   * Load hash cache from disk
   */
  loadHashCache() {
    try {
      if (fs.existsSync(HASH_FILE)) {
        const content = fs.readFileSync(HASH_FILE, 'utf-8');
        const data = JSON.parse(content);
        this.hashCache = new Map(Object.entries(data));
      }
    } catch (e) {
      this.hashCache = new Map();
    }
  }

  /**
   * Save hash cache to disk
   */
  saveHashCache() {
    try {
      const data = Object.fromEntries(this.hashCache);
      fs.writeFileSync(HASH_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      // Ignore save errors
    }
  }

  /**
   * Get all memory files to index (unlimited - no time restriction)
   * @returns {Array<{path: string, name: string}>}
   */
  getMemoryFiles() {
    return getMemoryFiles();
  }

  /**
   * Check if a file has changed
   * @param {string} filePath - Path to file
   * @param {string} fileName - Name for display
   * @returns {{changed: boolean, hash: string, previousHash: string|null}}
   */
  checkFileChanged(filePath, fileName) {
    const currentHash = this.calculateFileHash(filePath);
    const previousHash = this.hashCache.get(fileName);
    
    return {
      changed: currentHash !== previousHash,
      hash: currentHash,
      previousHash
    };
  }

  /**
   * Get list of changed files
   * @returns {Array<{path: string, name: string, hash: string}>}
   */
  getChangedFiles() {
    const files = this.getMemoryFiles();
    const changed = [];
    
    for (const file of files) {
      const { changed: isChanged, hash } = this.checkFileChanged(file.path, file.name);
      if (isChanged && hash) {
        changed.push({ ...file, hash });
      }
    }
    
    return changed;
  }

  /**
   * Queue a file for index update
   * @param {string} filePath - Path to file
   * @param {string} fileName - Name for display
   */
  queueUpdate(filePath, fileName) {
    // Avoid duplicates in queue
    const existing = this.updateQueue.find(f => f.name === fileName);
    if (existing) {
      existing.path = filePath; // Update path
      return;
    }
    
    this.updateQueue.push({ path: filePath, name: fileName });
    this.scheduleProcess();
  }

  /**
   * Schedule debounced processing
   */
  scheduleProcess() {
    const config = this.getConfig();
    const delay = config.indexing?.debounceDelay || DEFAULT_DEBOUNCE_DELAY;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, delay);
  }

  /**
   * Process the update queue
   */
  async processQueue() {
    // Atomic check-and-set to prevent race condition
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    if (this.updateQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    const config = this.getConfig();
    const batchSize = config.indexing?.batchSize || 10;
    
    try {
      const vectorStore = getVectorStore();
      
      // Initialize if needed
      if (!vectorStore.initialized) {
        await vectorStore.initialize({ model: config.embedding?.model });
      }
      
      // Process in batches
      while (this.updateQueue.length > 0) {
        const batch = this.updateQueue.splice(0, batchSize);
        
        for (const file of batch) {
          try {
            const content = fs.readFileSync(file.path, 'utf-8');
            await vectorStore.indexDocument(content, file.name, {
              clearExisting: true,
              chunkSize: config.indexing?.chunkSize || 400,
              overlap: config.indexing?.chunkOverlap || 80
            });
            
            // Update hash cache
            const hash = this.calculateFileHash(file.path);
            if (hash) {
              this.hashCache.set(file.name, hash);
            }
          } catch (e) {
            console.error(`Failed to index ${file.name}:`, e.message);
          }
        }
      }
      
      // Save updated hash cache
      this.saveHashCache();
    } catch (e) {
      console.error('Failed to process index queue:', e.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Update index for a single file (immediate)
   * @param {string} filePath - Path to file
   * @param {string} fileName - Name for display
   * @returns {Promise<{success: boolean, indexed: number}>}
   */
  async updateFileIndex(filePath, fileName) {
    const config = this.getConfig();
    
    try {
      const vectorStore = getVectorStore();
      
      if (!vectorStore.initialized) {
        await vectorStore.initialize({ model: config.embedding?.model });
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = await vectorStore.indexDocument(content, fileName, {
        clearExisting: true,
        chunkSize: config.indexing?.chunkSize || 400,
        overlap: config.indexing?.chunkOverlap || 80
      });
      
      // Update hash cache
      const hash = this.calculateFileHash(filePath);
      if (hash) {
        this.hashCache.set(fileName, hash);
        this.saveHashCache();
      }
      
      return { success: true, indexed: result.indexed };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Rebuild entire index
   * @param {boolean} force - Force rebuild even if no changes
   * @returns {Promise<{success: boolean, indexedFiles: number, totalChunks: number}>}
   */
  async rebuildIndex(force = false) {
    const config = this.getConfig();

    try {
      const vectorStore = getVectorStore();

      // Check if we need to initialize or if model is not available
      if (!vectorStore.initialized || !vectorStore.extractor) {
        const initResult = await vectorStore.initialize({ model: config.embedding?.model });
        if (!initResult.success || !vectorStore.extractor) {
          // Model failed to load - still mark files as indexed in hash cache
          // so we don't keep retrying, but return with fallback info
          const files = force ? this.getMemoryFiles() : this.getChangedFiles();

          if (files.length === 0) {
            return { success: true, indexedFiles: 0, totalChunks: 0, message: 'No changes detected' };
          }

          // Update hashes to prevent repeated attempts
          for (const file of files) {
            const hash = this.calculateFileHash(file.path);
            if (hash) {
              this.hashCache.set(file.name, hash);
            }
          }
          this.saveHashCache();

          return {
            success: true,
            indexedFiles: files.length,
            totalChunks: 0,
            files: files.map(f => f.name),
            warning: `Vector indexing skipped: ${initResult.error || 'Model not available'}. Keyword search will still work.`
          };
        }
      }
      
      // Clear existing index if forced
      if (force) {
        vectorStore.clearIndex();
        this.hashCache.clear();
      }
      
      const files = force ? this.getMemoryFiles() : this.getChangedFiles();
      
      if (files.length === 0) {
        return { success: true, indexedFiles: 0, totalChunks: 0, message: 'No changes detected' };
      }
      
      let totalChunks = 0;
      
      for (const file of files) {
        const content = fs.readFileSync(file.path, 'utf-8');
        const result = await vectorStore.indexDocument(content, file.name, {
          clearExisting: true,
          chunkSize: config.indexing?.chunkSize || 400,
          overlap: config.indexing?.chunkOverlap || 80
        });
        totalChunks += result.indexed;
        
        // Update hash
        const hash = this.calculateFileHash(file.path);
        if (hash) {
          this.hashCache.set(file.name, hash);
        }
      }
      
      this.saveHashCache();
      
      return {
        success: true,
        indexedFiles: files.length,
        totalChunks,
        files: files.map(f => f.name)
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Get index status
   * @returns {Object}
   */
  getStatus() {
    const files = this.getMemoryFiles();
    const changedFiles = this.getChangedFiles();
    
    return {
      totalFiles: files.length,
      changedFiles: changedFiles.length,
      queuedFiles: this.updateQueue.length,
      isProcessing: this.isProcessing,
      hashCacheSize: this.hashCache.size,
      files: {
        core: files.filter(f => !f.name.includes('/')).length,
        daily: files.filter(f => f.name.startsWith('daily/')).length,
        sessions: files.filter(f => f.name.startsWith('sessions/')).length
      }
    };
  }

  /**
   * Clear hash cache
   */
  clearCache() {
    this.hashCache.clear();
    this.saveHashCache();
  }

  /**
   * Configure index behavior
   * @param {Object} options - Configuration options
   */
  configure(options) {
    const config = this.getConfig();
    
    if (options.autoUpdate !== undefined) {
      config.indexing = config.indexing || {};
      config.indexing.autoUpdate = options.autoUpdate;
    }
    
    if (options.debounceDelay !== undefined) {
      config.indexing = config.indexing || {};
      config.indexing.debounceDelay = options.debounceDelay;
    }
    
    if (options.batchSize !== undefined) {
      config.indexing = config.indexing || {};
      config.indexing.batchSize = options.batchSize;
    }
    
    this.config = config;
    
    // Save to config file
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
      // Ignore save errors
    }
    
    return config;
  }

  /**
   * Cleanup resources (prevent memory leaks)
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.updateQueue = [];
    this.isProcessing = false;
  }
}

// Singleton instance
let indexManagerInstance = null;

/**
 * Get or create index manager instance
 */
export function getIndexManager() {
  if (!indexManagerInstance) {
    indexManagerInstance = new IndexManager();
  }
  return indexManagerInstance;
}

/**
 * Reset singleton instance (for testing)
 */
export function resetIndexManager() {
  if (indexManagerInstance) {
    indexManagerInstance.destroy();
    indexManagerInstance = null;
  }
}

export default IndexManager;