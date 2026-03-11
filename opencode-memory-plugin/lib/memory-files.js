/**
 * Memory Files Utility Module
 *
 * Shared utilities for discovering and managing memory files.
 * Used by both plugin.js and index-manager.js
 */

import fs from 'fs';
import path from 'path';

const HOME = process.env.HOME || process.env.USERPROFILE;
const MEMORY_DIR = path.join(HOME, '.opencode', 'memory');
const DAILY_DIR = path.join(MEMORY_DIR, 'daily');
const SESSIONS_DIR = path.join(MEMORY_DIR, 'sessions');

/**
 * Core memory file names
 */
export const CORE_MEMORY_FILES = [
  'MEMORY.md',
  'SOUL.md',
  'AGENTS.md',
  'USER.md',
  'IDENTITY.md',
  'TOOLS.md'
];

/**
 * Get all memory files to index
 * @param {Object} options - Options for filtering
 * @param {number} options.limitDaily - Limit number of daily files (0 = unlimited)
 * @param {number} options.limitSessions - Limit number of session files (0 = unlimited)
 * @returns {Array<{path: string, name: string}>}
 */
export function getMemoryFiles(options = {}) {
  const { limitDaily = 0, limitSessions = 0 } = options;
  const files = [];

  // Core memory files
  for (const file of CORE_MEMORY_FILES) {
    const filePath = path.join(MEMORY_DIR, file);
    if (fs.existsSync(filePath)) {
      files.push({ path: filePath, name: file });
    }
  }

  // Daily logs
  if (fs.existsSync(DAILY_DIR)) {
    const dailyFiles = fs.readdirSync(DAILY_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse(); // Most recent first

    const dailyLimit = limitDaily > 0 ? limitDaily : dailyFiles.length;
    for (const file of dailyFiles.slice(0, dailyLimit)) {
      files.push({
        path: path.join(DAILY_DIR, file),
        name: `daily/${file}`
      });
    }
  }

  // Session records
  if (fs.existsSync(SESSIONS_DIR)) {
    const sessionFiles = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse();

    const sessionLimit = limitSessions > 0 ? limitSessions : sessionFiles.length;
    for (const file of sessionFiles.slice(0, sessionLimit)) {
      files.push({
        path: path.join(SESSIONS_DIR, file),
        name: `sessions/${file}`
      });
    }
  }

  return files;
}

/**
 * Get memory directory path
 * @returns {string}
 */
export function getMemoryDir() {
  return MEMORY_DIR;
}

/**
 * Get daily directory path
 * @returns {string}
 */
export function getDailyDir() {
  return DAILY_DIR;
}

/**
 * Get sessions directory path
 * @returns {string}
 */
export function getSessionsDir() {
  return SESSIONS_DIR;
}

/**
 * Ensure a directory exists
 * @param {string} dirPath - Directory path
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate a slug from content
 * @param {string} content - Content to extract keywords from
 * @returns {string} URL-friendly slug
 */
export function generateSlug(content) {
  // Extract key phrases from content
  const lines = content.split('\n').filter(l => l.trim());

  // Get first meaningful line (title or first paragraph)
  let title = '';
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip markdown headings and empty lines
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && trimmed.length > 5) {
      title = trimmed;
      break;
    }
    // Use heading if no paragraph found
    if (trimmed.startsWith('#') && !title) {
      title = trimmed.replace(/^#+\s*/, '');
    }
  }

  if (!title) {
    title = 'session';
  }

  // Generate slug
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
    .replace(/^-|-$/g, '');
}

export default {
  CORE_MEMORY_FILES,
  getMemoryFiles,
  getMemoryDir,
  getDailyDir,
  getSessionsDir,
  ensureDir,
  generateSlug
};