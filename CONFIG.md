# Memory Plugin Configuration Guide

The OpenCode Memory Plugin supports various configuration options to customize its behavior. This guide explains how to configure the memory system.

## Configuration File

Configuration is stored in: `~/.opencode/memory/memory-config.json`

The configuration file is automatically created with default values when you first use the plugin.

## Configuration Options

### Embedding Settings

```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "apiKey": "sk-...",
    "baseURL": "https://api.openai.com/v1",
    "cacheEnabled": true
  }
}
```

#### Provider Options

- **`openai`**: Use OpenAI Embeddings API (recommended)
  - Requires API key (see below)
  - Best semantic search quality
  - Models: `text-embedding-3-small` (default), `text-embedding-3-large`, `text-embedding-ada-002`

- **`local`**: Use local embedding model (not yet implemented)
  - Will use `node-llama-cpp` in the future
  - No API costs
  - Runs entirely on your machine

- **`none`**: Use hash-based fallback (not recommended)
  - Fast but poor semantic understanding
  - Only uses word matching, not true semantics
  - Use only for testing or offline scenarios

#### Setting OpenAI API Key

**Option 1: Environment Variable (Recommended)**
```bash
export OPENAI_API_KEY="sk-..."
# Add to your ~/.zshrc or ~/.bashrc for persistence
```

**Option 2: Configuration File**
```json
{
  "embedding": {
    "apiKey": "sk-..."
  }
}
```

**Option 3: Custom Base URL**
```json
{
  "embedding": {
    "baseURL": "https://your-custom-endpoint.com/v1"
  }
}
```

This is useful for:
- Using compatible APIs (Together AI, Groq, etc.)
- Corporate proxy configurations
- Local OpenAI-compatible servers

#### Caching

Embedding caching is enabled by default to avoid re-computing embeddings for identical text.

```json
{
  "embedding": {
    "cacheEnabled": true
  }
}
```

### Auto-Indexing

```json
{
  "autoIndex": true
}
```

When `true`, the vector index is automatically updated after each memory write. This ensures search results are always up-to-date.

When `false`, you must manually run `rebuild_index` to update the search index.

### Indexing Settings

```json
{
  "indexing": {
    "chunkSize": 400,
    "chunkOverlap": 80
  }
}
```

- **`chunkSize`**: Target token count per chunk (default: 400)
  - Larger chunks = more context per match
  - Smaller chunks = more precise matches

- **`chunkOverlap`**: Overlap between chunks (default: 80)
  - Prevents important info from being split across boundaries
  - Should be ~20% of chunk size

## Example Configurations

### Minimal Configuration (Free)

```json
{
  "embedding": {
    "provider": "none",
    "cacheEnabled": false
  },
  "autoIndex": false
}
```

**Pros**: No API costs, works offline
**Cons**: Poor semantic search, manual index rebuilding

### Recommended Configuration (Best Quality)

```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "cacheEnabled": true
  },
  "autoIndex": true
}
```

**Pros**: Best semantic search, automatic updates
**Cons**: Small API costs (~$0.00002 per 1K tokens)

### High-Quality Configuration

```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-large",
    "cacheEnabled": true
  },
  "autoIndex": true
}
```

**Pros**: Best semantic understanding
**Cons**: Higher API costs (~$0.00013 per 1K tokens)

### Custom API Endpoint

```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "baseURL": "https://api.together.xyz/v1",
    "apiKey": "your-together-api-key",
    "cacheEnabled": true
  },
  "autoIndex": true
}
```

**Pros**: Use alternative providers (Together AI, Groq, etc.)
**Cons**: May require API key from that provider

## Cost Estimates

Using OpenAI's `text-embedding-3-small`:

- **Cost**: $0.00002 per 1K tokens
- **Typical memory entry**: ~100 tokens
- **Cost per memory**: ~$0.000002 (0.002 cents)
- **1000 memories**: ~$0.02 (2 cents)

Using OpenAI's `text-embedding-3-large`:

- **Cost**: $0.00013 per 1K tokens
- **Typical memory entry**: ~100 tokens
- **Cost per memory**: ~$0.000013 (0.013 cents)
- **1000 memories**: ~$0.13 (13 cents)

## Troubleshooting

### "OpenAI API key not found"

**Error message:**
```
Warning: OpenAI API key not found (set OPENAI_API_KEY env var or configure in memory-config.json).
Falling back to hash-based embedding.
```

**Solution:**
1. Set environment variable: `export OPENAI_API_KEY="sk-..."`
2. Or add to config file: `~/.opencode/memory/memory-config.json`

### Semantic search not working well

**Possible causes:**
1. Using `provider: "none"` (hash-based fallback)
2. Vector index not built
3. Very short queries

**Solutions:**
1. Configure OpenAI API (see above)
2. Run `rebuild_index force=true`
3. Use more descriptive queries

### Slow memory writes

**Possible causes:**
1. Auto-indexing enabled with large memory files
2. API latency

**Solutions:**
1. Set `"autoIndex": false` and run `rebuild_index` periodically
2. Use caching (enabled by default)
3. Check your internet connection

### Index out of date

**Symptoms:**
- Recent memories not appearing in search
- Search results missing recent entries

**Solution:**
```bash
# In OpenCode
rebuild_index force=true
```

## Advanced: Environment Variables

You can override config file settings with environment variables:

- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_BASE_URL`: Custom API endpoint
- `MEMORY_AUTO_INDEX`: Override autoIndex setting ("true" or "false")

Environment variables take precedence over config file values.

## Configuration Validation

If your configuration file is invalid, the plugin will use default values and log an error. Check OpenCode logs for details.

To validate your config:

```bash
cat ~/.opencode/memory/memory-config.json | python -m json.tool
```

## Next Steps

- [See INSTALL.md for installation guide](INSTALL.md)
- [See README.md for usage examples](README.md)
- [Run `rebuild_index` to create initial vector index](README.md)
