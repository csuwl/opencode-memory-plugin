import { readFile, writeFile, mkdir, access } from "fs/promises"
import path from "path"

const MEMORY_DIR = path.join(process.env.HOME || "", ".opencode", "memory")
const CONFIG_PATH = path.join(MEMORY_DIR, "memory-config.json")

/**
 * Memory system configuration
 */
export interface MemoryConfig {
  embedding: {
    provider: 'openai' | 'local' | 'none'
    model?: string
    apiKey?: string
    baseURL?: string
    cacheEnabled: boolean
  }
  autoIndex: boolean
  indexing: {
    chunkSize: number
    chunkOverlap: number
  }
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: MemoryConfig = {
  embedding: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    cacheEnabled: true,
  },
  autoIndex: true,
  indexing: {
    chunkSize: 400,
    chunkOverlap: 80,
  },
}

/**
 * Load configuration from file or create default
 */
export async function loadConfig(): Promise<MemoryConfig> {
  try {
    // Ensure memory directory exists
    await mkdir(MEMORY_DIR, { recursive: true })

    // Check if config file exists
    try {
      await access(CONFIG_PATH)
    } catch {
      // File doesn't exist, create default config
      await writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2))
      return DEFAULT_CONFIG
    }

    // Read and parse config
    const content = await readFile(CONFIG_PATH, 'utf-8')
    const config = JSON.parse(content)

    // Merge with defaults to handle missing fields
    return {
      ...DEFAULT_CONFIG,
      ...config,
      embedding: {
        ...DEFAULT_CONFIG.embedding,
        ...config.embedding,
      },
      indexing: {
        ...DEFAULT_CONFIG.indexing,
        ...config.indexing,
      },
    }
  } catch (error) {
    console.error('Failed to load config, using defaults:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: MemoryConfig): Promise<void> {
  try {
    await mkdir(MEMORY_DIR, { recursive: true })
    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('Failed to save config:', error)
    throw error
  }
}

/**
 * Get OpenAI API key from config or environment
 */
export function getOpenAIKey(config: MemoryConfig): string | undefined {
  return config.embedding.apiKey || process.env.OPENAI_API_KEY
}

/**
 * Get OpenAI base URL from config or environment
 */
export function getOpenAIBaseURL(config: MemoryConfig): string | undefined {
  return config.embedding.baseURL || process.env.OPENAI_BASE_URL
}
