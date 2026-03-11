/**
 * Unit tests for Error handling module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorCodes,
  MemoryError,
  errors,
  successResponse,
  errorResponse
} from '../../lib/errors.js';

describe('MemoryError', () => {
  it('should create an error with code', () => {
    const error = new MemoryError(ErrorCodes.FILE_NOT_FOUND, 'File not found: test.md');
    expect(error.code).toBe(ErrorCodes.FILE_NOT_FOUND);
    expect(error.message).toBe('File not found: test.md');
    expect(error.name).toBe('MemoryError');
  });

  it('should include context', () => {
    const error = new MemoryError(ErrorCodes.FILE_NOT_FOUND, 'File not found', { file: 'test.md' });
    expect(error.context).toEqual({ file: 'test.md' });
  });

  it('should include timestamp', () => {
    const error = new MemoryError(ErrorCodes.UNKNOWN_ERROR);
    expect(error.timestamp).toBeDefined();
    expect(new Date(error.timestamp)).toBeInstanceOf(Date);
  });

  it('should serialize to JSON', () => {
    const error = new MemoryError(ErrorCodes.FILE_NOT_FOUND, 'File not found', { file: 'test.md' });
    const json = error.toJSON();

    expect(json.code).toBe(ErrorCodes.FILE_NOT_FOUND);
    expect(json.message).toBe('File not found');
    expect(json.context).toEqual({ file: 'test.md' });
  });
});

describe('Error factory functions', () => {
  describe('configNotFound', () => {
    it('should create CONFIG_NOT_FOUND error', () => {
      const error = errors.configNotFound();
      expect(error.code).toBe(ErrorCodes.CONFIG_NOT_FOUND);
    });
  });

  describe('fileNotFound', () => {
    it('should create FILE_NOT_FOUND error with file name', () => {
      const error = errors.fileNotFound('MEMORY.md');
      expect(error.code).toBe(ErrorCodes.FILE_NOT_FOUND);
      expect(error.message).toContain('MEMORY.md');
      expect(error.context.file).toBe('MEMORY.md');
    });
  });

  describe('pathTraversal', () => {
    it('should create PATH_TRAVERSAL error', () => {
      const error = errors.pathTraversal();
      expect(error.code).toBe(ErrorCodes.PATH_TRAVERSAL);
      expect(error.message).toContain('directory traversal');
    });
  });

  describe('invalidInput', () => {
    it('should create INVALID_INPUT error with details', () => {
      const error = errors.invalidInput('Content cannot be empty');
      expect(error.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(error.message).toContain('Content cannot be empty');
    });
  });

  describe('contentTooLarge', () => {
    it('should create CONTENT_TOO_LARGE error', () => {
      const error = errors.contentTooLarge(1024, 2048);
      expect(error.code).toBe(ErrorCodes.CONTENT_TOO_LARGE);
      expect(error.context.maxSize).toBe(1024);
      expect(error.context.actualSize).toBe(2048);
    });
  });

  describe('indexBuildFailed', () => {
    it('should create INDEX_BUILD_FAILED error', () => {
      const error = errors.indexBuildFailed('Model not loaded');
      expect(error.code).toBe(ErrorCodes.INDEX_BUILD_FAILED);
      expect(error.context.reason).toBe('Model not loaded');
    });
  });

  describe('embeddingModelLoadFailed', () => {
    it('should create EMBEDDING_MODEL_LOAD_FAILED error', () => {
      const originalError = new Error('Network error');
      const error = errors.embeddingModelLoadFailed('Xenova/all-MiniLM-L6-v2', originalError);
      expect(error.code).toBe(ErrorCodes.EMBEDDING_MODEL_LOAD_FAILED);
      expect(error.context.model).toBe('Xenova/all-MiniLM-L6-v2');
    });
  });
});

describe('successResponse', () => {
  it('should create a success JSON response', () => {
    const response = successResponse({ message: 'Done', count: 5 });
    const parsed = JSON.parse(response);

    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe('Done');
    expect(parsed.count).toBe(5);
  });
});

describe('errorResponse', () => {
  it('should create an error JSON response from MemoryError', () => {
    const error = errors.fileNotFound('test.md');
    const response = errorResponse(error);
    const parsed = JSON.parse(response);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('test.md');
    expect(parsed.code).toBe(ErrorCodes.FILE_NOT_FOUND);
  });

  it('should create an error JSON response from string', () => {
    const response = errorResponse('Something went wrong');
    const parsed = JSON.parse(response);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toBe('Something went wrong');
  });

  it('should create an error JSON response from Error object', () => {
    const error = new Error('Unexpected error');
    const response = errorResponse(error);
    const parsed = JSON.parse(response);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toBe('Unexpected error');
  });
});