/**
 * Unit tests for Memory Files utility module
 */

import { describe, it, expect } from 'vitest';
import {
  CORE_MEMORY_FILES,
  getMemoryDir,
  getDailyDir,
  getSessionsDir,
  generateSlug
} from '../../lib/memory-files.js';

describe('CORE_MEMORY_FILES', () => {
  it('should contain expected memory file names', () => {
    expect(CORE_MEMORY_FILES).toContain('MEMORY.md');
    expect(CORE_MEMORY_FILES).toContain('SOUL.md');
    expect(CORE_MEMORY_FILES).toContain('AGENTS.md');
    expect(CORE_MEMORY_FILES).toContain('USER.md');
    expect(CORE_MEMORY_FILES).toContain('IDENTITY.md');
    expect(CORE_MEMORY_FILES).toContain('TOOLS.md');
  });

  it('should have exactly 6 core files', () => {
    expect(CORE_MEMORY_FILES.length).toBe(6);
  });
});

describe('getMemoryDir', () => {
  it('should return memory directory path', () => {
    const dir = getMemoryDir();
    expect(dir).toContain('.opencode');
    expect(dir).toContain('memory');
  });
});

describe('getDailyDir', () => {
  it('should return daily directory path', () => {
    const dir = getDailyDir();
    expect(dir).toContain('daily');
  });
});

describe('getSessionsDir', () => {
  it('should return sessions directory path', () => {
    const dir = getSessionsDir();
    expect(dir).toContain('sessions');
  });
});

describe('generateSlug', () => {
  it('should generate slug from simple text', () => {
    const slug = generateSlug('Hello World');
    expect(slug).toBe('hello-world');
  });

  it('should handle special characters', () => {
    const slug = generateSlug('Hello @World! #Test');
    expect(slug).toBe('hello-world-test');
  });

  it('should handle multiple spaces', () => {
    const slug = generateSlug('Hello    World');
    expect(slug).toBe('hello-world');
  });

  it('should truncate long content', () => {
    const longText = 'a'.repeat(100);
    const slug = generateSlug(longText);
    expect(slug.length).toBeLessThanOrEqual(50);
  });

  it('should use paragraph content over heading', () => {
    const content = '# My Title\n\nSome text content here';
    const slug = generateSlug(content);
    // generateSlug prefers first non-heading paragraph
    expect(slug).toContain('some');
  });

  it('should return "session" for empty content', () => {
    const slug = generateSlug('');
    expect(slug).toBe('session');
  });

  it('should skip markdown headings for title extraction', () => {
    const content = '# Heading\n\nThis is the actual content for the title.';
    const slug = generateSlug(content);
    expect(slug).toContain('actual');
  });

  it('should remove leading and trailing hyphens', () => {
    const slug = generateSlug('---Hello World---');
    expect(slug).toBe('hello-world');
  });

  it('should handle content with asterisks', () => {
    const content = '*italic text* and **bold text**';
    const slug = generateSlug(content);
    // Should skip lines starting with *
    expect(slug).toBeTruthy();
  });

  it('should handle very short content', () => {
    const slug = generateSlug('Hi');
    // Short content less than 5 chars should fall back to 'session' or similar
    expect(slug).toBeTruthy();
  });

  it('should normalize multiple hyphens', () => {
    const slug = generateSlug('Hello---World---Test');
    expect(slug).toBe('hello-world-test');
  });
});