/**
 * Error Handling Module for OpenCode Memory Plugin
 *
 * Provides structured error handling with:
 * - Error codes and types
 * - Error factory functions
 * - Logger utility
 */

// Error codes
export const ErrorCodes = {
  // Configuration errors
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  CONFIG_INVALID: 'CONFIG_INVALID',

  // File operations
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',

  // Security errors
  PATH_TRAVERSAL: 'PATH_TRAVERSAL',
  INVALID_INPUT: 'INVALID_INPUT',
  CONTENT_TOO_LARGE: 'CONTENT_TOO_LARGE',

  // Index errors
  INDEX_NOT_INITIALIZED: 'INDEX_NOT_INITIALIZED',
  INDEX_BUILD_FAILED: 'INDEX_BUILD_FAILED',
  EMBEDDING_MODEL_LOAD_FAILED: 'EMBEDDING_MODEL_LOAD_FAILED',

  // Database errors
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',

  // Sync errors
  SYNC_DB_NOT_FOUND: 'SYNC_DB_NOT_FOUND',
  SYNC_FAILED: 'SYNC_FAILED',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error messages
const ErrorMessages = {
  [ErrorCodes.CONFIG_NOT_FOUND]: 'Memory configuration not found. Please run the initialization script.',
  [ErrorCodes.CONFIG_INVALID]: 'Memory configuration is invalid.',
  [ErrorCodes.FILE_NOT_FOUND]: 'File not found: {file}',
  [ErrorCodes.FILE_READ_ERROR]: 'Failed to read file: {file}',
  [ErrorCodes.FILE_WRITE_ERROR]: 'Failed to write file: {file}',
  [ErrorCodes.DIRECTORY_NOT_FOUND]: 'Directory not found: {dir}',
  [ErrorCodes.PATH_TRAVERSAL]: 'Invalid file path: directory traversal not allowed',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input: {details}',
  [ErrorCodes.CONTENT_TOO_LARGE]: 'Content exceeds maximum size limit ({max} bytes)',
  [ErrorCodes.INDEX_NOT_INITIALIZED]: 'Vector index not initialized',
  [ErrorCodes.INDEX_BUILD_FAILED]: 'Failed to build vector index: {reason}',
  [ErrorCodes.EMBEDDING_MODEL_LOAD_FAILED]: 'Failed to load embedding model: {model}',
  [ErrorCodes.DB_CONNECTION_ERROR]: 'Failed to connect to database',
  [ErrorCodes.DB_QUERY_ERROR]: 'Database query failed: {query}',
  [ErrorCodes.SYNC_DB_NOT_FOUND]: 'OpenCode database not found',
  [ErrorCodes.SYNC_FAILED]: 'Session sync failed: {reason}',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unknown error occurred'
};

/**
 * Custom error class with code and context
 */
export class MemoryError extends Error {
  constructor(code, message, context = {}) {
    super(message || ErrorMessages[code] || 'Unknown error');
    this.name = 'MemoryError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp
    };
  }
}

/**
 * Format error message with context
 * @param {string} template - Message template with placeholders
 * @param {Object} context - Context values
 * @returns {string}
 */
function formatMessage(template, context = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] !== undefined ? context[key] : match;
  });
}

/**
 * Error factory functions
 */
export const errors = {
  configNotFound() {
    return new MemoryError(ErrorCodes.CONFIG_NOT_FOUND);
  },

  configInvalid(details = '') {
    return new MemoryError(
      ErrorCodes.CONFIG_INVALID,
      `Memory configuration is invalid${details ? ': ' + details : ''}`
    );
  },

  fileNotFound(file) {
    return new MemoryError(
      ErrorCodes.FILE_NOT_FOUND,
      formatMessage(ErrorMessages[ErrorCodes.FILE_NOT_FOUND], { file }),
      { file }
    );
  },

  fileReadError(file, originalError = null) {
    return new MemoryError(
      ErrorCodes.FILE_READ_ERROR,
      formatMessage(ErrorMessages[ErrorCodes.FILE_READ_ERROR], { file }),
      { file, originalError: originalError?.message }
    );
  },

  fileWriteError(file, originalError = null) {
    return new MemoryError(
      ErrorCodes.FILE_WRITE_ERROR,
      formatMessage(ErrorMessages[ErrorCodes.FILE_WRITE_ERROR], { file }),
      { file, originalError: originalError?.message }
    );
  },

  directoryNotFound(dir) {
    return new MemoryError(
      ErrorCodes.DIRECTORY_NOT_FOUND,
      formatMessage(ErrorMessages[ErrorCodes.DIRECTORY_NOT_FOUND], { dir }),
      { dir }
    );
  },

  pathTraversal() {
    return new MemoryError(ErrorCodes.PATH_TRAVERSAL);
  },

  invalidInput(details) {
    return new MemoryError(
      ErrorCodes.INVALID_INPUT,
      formatMessage(ErrorMessages[ErrorCodes.INVALID_INPUT], { details }),
      { details }
    );
  },

  contentTooLarge(maxSize, actualSize) {
    return new MemoryError(
      ErrorCodes.CONTENT_TOO_LARGE,
      formatMessage(ErrorMessages[ErrorCodes.CONTENT_TOO_LARGE], { max: maxSize }),
      { maxSize, actualSize }
    );
  },

  indexNotInitialized() {
    return new MemoryError(ErrorCodes.INDEX_NOT_INITIALIZED);
  },

  indexBuildFailed(reason) {
    return new MemoryError(
      ErrorCodes.INDEX_BUILD_FAILED,
      formatMessage(ErrorMessages[ErrorCodes.INDEX_BUILD_FAILED], { reason }),
      { reason }
    );
  },

  embeddingModelLoadFailed(model, originalError = null) {
    return new MemoryError(
      ErrorCodes.EMBEDDING_MODEL_LOAD_FAILED,
      formatMessage(ErrorMessages[ErrorCodes.EMBEDDING_MODEL_LOAD_FAILED], { model }),
      { model, originalError: originalError?.message }
    );
  },

  dbConnectionError(originalError = null) {
    return new MemoryError(
      ErrorCodes.DB_CONNECTION_ERROR,
      ErrorMessages[ErrorCodes.DB_CONNECTION_ERROR],
      { originalError: originalError?.message }
    );
  },

  dbQueryError(query, originalError = null) {
    return new MemoryError(
      ErrorCodes.DB_QUERY_ERROR,
      formatMessage(ErrorMessages[ErrorCodes.DB_QUERY_ERROR], { query }),
      { query, originalError: originalError?.message }
    );
  },

  syncDbNotFound() {
    return new MemoryError(ErrorCodes.SYNC_DB_NOT_FOUND);
  },

  syncFailed(reason) {
    return new MemoryError(
      ErrorCodes.SYNC_FAILED,
      formatMessage(ErrorMessages[ErrorCodes.SYNC_FAILED], { reason }),
      { reason }
    );
  }
};

/**
 * Logger utility
 */
class Logger {
  constructor(prefix = 'MemoryPlugin') {
    this.prefix = prefix;
    this.debugMode = process.env.MEMORY_PLUGIN_DEBUG === 'true';
  }

  _formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0
      ? ` ${JSON.stringify(context)}`
      : '';
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}${contextStr}`;
  }

  debug(message, context = {}) {
    if (this.debugMode) {
      console.debug(this._formatMessage('DEBUG', message, context));
    }
  }

  info(message, context = {}) {
    console.log(this._formatMessage('INFO', message, context));
  }

  warn(message, context = {}) {
    console.warn(this._formatMessage('WARN', message, context));
  }

  error(message, context = {}) {
    console.error(this._formatMessage('ERROR', message, context));
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

// Singleton logger instance
export const logger = new Logger();

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Options
 * @param {string} options.defaultMessage - Default error message
 * @param {string} options.errorCode - Error code for caught errors
 * @returns {Function}
 */
export function withErrorHandling(fn, options = {}) {
  const { defaultMessage = 'Operation failed', errorCode = ErrorCodes.UNKNOWN_ERROR } = options;

  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof MemoryError) {
        throw error;
      }

      logger.error(defaultMessage, {
        error: error.message,
        stack: error.stack
      });

      throw new MemoryError(errorCode, error.message, {
        originalError: error.message
      });
    }
  };
}

/**
 * Create a standardized success response
 * @param {Object} data - Response data
 * @returns {string} JSON string
 */
export function successResponse(data) {
  return JSON.stringify({
    success: true,
    ...data
  });
}

/**
 * Create a standardized error response
 * @param {Error|string} error - Error object or message
 * @param {string} code - Error code (optional)
 * @returns {string} JSON string
 */
export function errorResponse(error, code = null) {
  if (error instanceof MemoryError) {
    return JSON.stringify({
      success: false,
      error: error.message,
      code: error.code,
      context: error.context
    });
  }

  return JSON.stringify({
    success: false,
    error: typeof error === 'string' ? error : error.message,
    code: code || ErrorCodes.UNKNOWN_ERROR
  });
}

export default {
  ErrorCodes,
  MemoryError,
  errors,
  logger,
  withErrorHandling,
  successResponse,
  errorResponse
};