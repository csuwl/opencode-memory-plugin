/**
 * OpenCode Memory Plugin
 * 
 * This package provides an OpenClaw-style memory system for OpenCode
 * with full automation and local vector search capabilities.
 * 
 * Installation is handled automatically by the bin/install.js script
 * which runs on npm install.
 * 
 * @package @csuwl/opencode-memory-plugin
 * @version 1.0.0
 * @author csuwl <1105865632@qq.com>
 * @license MIT
 */

module.exports = {
  name: '@csuwl/opencode-memory-plugin',
  version: '1.0.0',
  description: 'OpenClaw-style memory system for OpenCode with full automation and local vector search',
  
  /**
   * Memory files location
   */
  memoryDir: '~/.opencode/memory/',
  
  /**
   * Available memory tools
   */
  tools: [
    'memory_write',
    'memory_read',
    'memory_search',
    'vector_memory_search',
    'list_daily',
    'init_daily',
    'rebuild_index',
    'index_status'
  ],
  
  /**
   * Available automation agents
   */
  agents: [
    '@memory-automation',
    '@memory-consolidate'
  ]
};
