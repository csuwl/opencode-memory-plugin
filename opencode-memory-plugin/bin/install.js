#!/usr/bin/env node

/**
 * OpenCode Memory Plugin - Installation Script
 * This script runs automatically on npm install or can be run manually
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getHomeDir() {
  return process.env.HOME || process.env.USERPROFILE;
}

// Paths
const HOME = getHomeDir();
const MEMORY_ROOT = path.join(HOME, '.opencode');
const MEMORY_DIR = path.join(MEMORY_ROOT, 'memory');
const DAILY_DIR = path.join(MEMORY_DIR, 'daily');
const OPENCORE_CONFIG_DIR = path.join(HOME, '.config', 'opencode');
const OPENCORE_CONFIG = path.join(OPENCORE_CONFIG_DIR, 'opencode.json');

// Get the directory where this script is located
const SCRIPT_DIR = __dirname;
const PLUGIN_DIR = path.dirname(SCRIPT_DIR);

// Required files
const MEMORY_FILES = [
  'SOUL.md',
  'AGENTS.md',
  'USER.md',
  'IDENTITY.md',
  'TOOLS.md',
  'MEMORY.md',
  'HEARTBEAT.md',
  'BOOT.md',
  'BOOTSTRAP.md'
];

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy file if it doesn't exist
 */
function copyFileIfNotExists(source, dest) {
  if (fs.existsSync(dest)) {
    log(`  ⊙ Exists: ${path.basename(dest)} (skipped)`, 'blue');
    return false;
  }

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    log(`  ✓ Created: ${path.basename(dest)}`, 'green');
    return true;
  } else {
    log(`  ✗ Missing: ${source}`, 'red');
    return false;
  }
}

/**
 * Create memory configuration
 */
function createMemoryConfig() {
  const configPath = path.join(MEMORY_DIR, 'memory-config.json');
  
  if (fs.existsSync(configPath)) {
    log('  ⊙ Configuration already exists', 'blue');
    return;
  }

  const config = {
    version: '1.0.0',
    auto_save: true,
    auto_save_threshold_tokens: 1000,
    vector_search: {
      enabled: true,
      hybrid: true,
      rebuild_interval_hours: 24
    },
    consolidation: {
      enabled: true,
      run_daily: true,
      run_hour: 23,
      archive_days: 30,
      delete_days: 90
    },
    git_backup: {
      enabled: false,
      auto_commit: false,
      auto_push: false
    },
    retention: {
      max_daily_files: 30,
      max_entries_per_file: 100,
      chunk_size: 400,
      chunk_overlap: 80
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  log('  ✓ Configuration created', 'green');
}

/**
 * Create or update OpenCode configuration
 */
function updateOpenCodeConfig() {
  ensureDir(OPENCORE_CONFIG_DIR);

  // Backup existing config
  if (fs.existsSync(OPENCORE_CONFIG)) {
    const backup = `${OPENCORE_CONFIG}.backup.${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}`;
    fs.copyFileSync(OPENCORE_CONFIG, backup);
    log('  ⊙ Backed up existing config', 'blue');
  }

  let config = {};

  // Try to read existing config
  try {
    if (fs.existsSync(OPENCORE_CONFIG)) {
      config = JSON.parse(fs.readFileSync(OPENCORE_CONFIG, 'utf8'));
    }
  } catch (e) {
    // Config is invalid, start fresh
    log('  ⚠ Existing config is invalid, creating new one', 'yellow');
  }

  // Add instructions if not present
  if (!config.instructions) {
    config.instructions = [
      '~/.opencode/memory/SOUL.md',
      '~/.opencode/memory/AGENTS.md',
      '~/.opencode/memory/USER.md',
      '~/.opencode/memory/IDENTITY.md',
      '~/.opencode/memory/TOOLS.md',
      '~/.opencode/memory/MEMORY.md'
    ];
    log('  ✓ Added memory instructions', 'green');
  }

  // Add agents if not present
  if (!config.agent) {
    config.agent = {};
  }

  if (!config.agent['memory-automation']) {
    config.agent['memory-automation'] = {
      description: 'Automatically saves important information to memory',
      mode: 'subagent',
      tools: {
        memory_write: true,
        memory_read: true,
        memory_search: true,
        vector_memory_search: true
      },
      permission: {
        memory_write: 'allow',
        memory_read: 'allow',
        memory_search: 'allow',
        vector_memory_search: 'allow'
      }
    };
    log('  ✓ Added memory-automation agent', 'green');
  }

  if (!config.agent['memory-consolidate']) {
    config.agent['memory-consolidate'] = {
      description: 'Consolidates daily logs into long-term memory',
      mode: 'subagent',
      tools: {
        memory_write: true,
        memory_read: true,
        memory_search: true,
        vector_memory_search: true,
        list_daily: true,
        rebuild_index: true
      },
      permission: {
        memory_write: 'allow',
        memory_read: 'allow',
        memory_search: 'allow',
        vector_memory_search: 'allow',
        list_daily: 'allow',
        rebuild_index: 'allow'
      }
    };
    log('  ✓ Added memory-consolidate agent', 'green');
  }

  // Add tools if not present
  if (!config.tools) {
    config.tools = {};
  }

  const tools = ['memory_write', 'memory_read', 'memory_search', 'vector_memory_search', 
                'list_daily', 'init_daily', 'rebuild_index', 'index_status'];
  let toolsAdded = false;
  
  tools.forEach(tool => {
    if (config.tools[tool] === undefined) {
      config.tools[tool] = true;
      toolsAdded = true;
    }
  });

  if (toolsAdded) {
    log('  ✓ Added memory tools', 'green');
  }

  // Write config
  fs.writeFileSync(OPENCORE_CONFIG, JSON.stringify(config, null, 2));
  log('  ✓ OpenCode configuration updated', 'green');
}

/**
 * Initialize today's daily log
 */
function initDailyLog() {
  const today = new Date().toISOString().split('T')[0];
  const dailyFile = path.join(DAILY_DIR, `${today}.md`);

  if (fs.existsSync(dailyFile)) {
    log(`  ⊙ Daily log already exists: ${today}.md`, 'blue');
    return;
  }

  const content = `# Daily Memory Log - ${today}

*Session starts: ${new Date().toISOString()}*

## Notes

## Tasks

## Learnings

---
`;

  fs.writeFileSync(dailyFile, content);
  log(`  ✓ Created daily log: ${today}.md`, 'green');
}

/**
 * Main installation function
 */
function install() {
  log('', 'blue');
  log('═════════════════════════════════════════════════════════════════', 'blue');
  log('  OpenCode Memory Plugin - Installation', 'blue');
  log('═════════════════════════════════════════════════════════════════', 'blue');
  log('', 'blue');

  // Step 1: Create directory structure
  log('Step 1/5: Creating memory directory structure...', 'yellow');
  ensureDir(MEMORY_DIR);
  ensureDir(DAILY_DIR);
  ensureDir(path.join(MEMORY_DIR, 'archive', 'weekly'));
  ensureDir(path.join(MEMORY_DIR, 'archive', 'monthly'));
  log('  ✓ Directory structure created', 'green');
  log('', 'reset');

  // Step 2: Copy memory files
  log('Step 2/5: Copying memory files...', 'yellow');
  MEMORY_FILES.forEach(file => {
    const source = path.join(PLUGIN_DIR, 'memory', file);
    const dest = path.join(MEMORY_DIR, file);
    copyFileIfNotExists(source, dest);
  });
  log('  ✓ Memory files copied', 'green');
  log('', 'reset');

  // Step 3: Create memory configuration
  log('Step 3/5: Creating memory configuration...', 'yellow');
  createMemoryConfig();
  log('', 'reset');

  // Step 4: Configure OpenCode
  log('Step 4/5: Configuring OpenCode...', 'yellow');
  updateOpenCodeConfig();
  log('', 'reset');

  // Step 5: Initialize daily log
  log('Step 5/5: Initializing today\'s daily log...', 'yellow');
  initDailyLog();
  log('', 'reset');

  // Summary
  log('═════════════════════════════════════════════════════════════════', 'blue');
  log('  ✓ Installation completed successfully!', 'green');
  log('═════════════════════════════════════════════════════════════════', 'blue');
  log('', 'reset');

  log('Memory System Structure:', 'yellow');
  log(`  📁 ${MEMORY_DIR}/`, 'blue');
  log(`    ├── SOUL.md          (personality & boundaries)`, 'green');
  log(`    ├── AGENTS.md        (operating instructions)`, 'green');
  log(`    ├── USER.md          (user profile)`, 'green');
  log(`    ├── IDENTITY.md      (assistant identity)`, 'green');
  log(`    ├── TOOLS.md         (tool conventions)`, 'green');
  log(`    ├── MEMORY.md        (long-term memory)`, 'green');
  log(`    ├── daily/           (daily logs)`, 'green');
  log(`    └── archive/         (archived logs)`, 'green');
  log('', 'reset');

  log('Next Steps:', 'yellow');
  log('  1. Review and personalize your memory files', 'blue');
  log('  2. Start OpenCode: opencode', 'blue');
  log('  3. Test memory tools:', 'blue');
  log('     memory_write content="Test memory" type="daily"', 'blue');
  log('     memory_search query="test"', 'blue');
  log('     vector_memory_search query="test"', 'blue');
  log('', 'reset');

  log('Available Agents:', 'yellow');
  log('  🤖 @memory-automation     (auto-saves important info)', 'green');
  log('  🤖 @memory-consolidate    (organizes & archives)', 'green');
  log('', 'reset');

  log('🎉 Your OpenCode instance now has perfect memory! 🧠', 'green');
  log('', 'reset');
}

// Run installation
try {
  install();
} catch (error) {
  log(`\n✗ Installation failed: ${error.message}`, 'red');
  log(`\nError details:`, 'red');
  console.error(error);
  process.exit(1);
}
