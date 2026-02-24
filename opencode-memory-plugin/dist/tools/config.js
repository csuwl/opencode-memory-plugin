"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.getOpenAIKey = getOpenAIKey;
exports.getOpenAIBaseURL = getOpenAIBaseURL;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const MEMORY_DIR = path_1.default.join(process.env.HOME || "", ".opencode", "memory");
const CONFIG_PATH = path_1.default.join(MEMORY_DIR, "memory-config.json");
/**
 * Default configuration
 */
exports.DEFAULT_CONFIG = {
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
};
/**
 * Load configuration from file or create default
 */
async function loadConfig() {
    try {
        // Ensure memory directory exists
        await (0, promises_1.mkdir)(MEMORY_DIR, { recursive: true });
        // Check if config file exists
        try {
            await (0, promises_1.access)(CONFIG_PATH);
        }
        catch {
            // File doesn't exist, create default config
            await (0, promises_1.writeFile)(CONFIG_PATH, JSON.stringify(exports.DEFAULT_CONFIG, null, 2));
            return exports.DEFAULT_CONFIG;
        }
        // Read and parse config
        const content = await (0, promises_1.readFile)(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(content);
        // Merge with defaults to handle missing fields
        return {
            ...exports.DEFAULT_CONFIG,
            ...config,
            embedding: {
                ...exports.DEFAULT_CONFIG.embedding,
                ...config.embedding,
            },
            indexing: {
                ...exports.DEFAULT_CONFIG.indexing,
                ...config.indexing,
            },
        };
    }
    catch (error) {
        console.error('Failed to load config, using defaults:', error);
        return exports.DEFAULT_CONFIG;
    }
}
/**
 * Save configuration to file
 */
async function saveConfig(config) {
    try {
        await (0, promises_1.mkdir)(MEMORY_DIR, { recursive: true });
        await (0, promises_1.writeFile)(CONFIG_PATH, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error('Failed to save config:', error);
        throw error;
    }
}
/**
 * Get OpenAI API key from config or environment
 */
function getOpenAIKey(config) {
    return config.embedding.apiKey || process.env.OPENAI_API_KEY;
}
/**
 * Get OpenAI base URL from config or environment
 */
function getOpenAIBaseURL(config) {
    return config.embedding.baseURL || process.env.OPENAI_BASE_URL;
}
