# @csuwl/opencode-memory-plugin

> OpenClaw-style persistent memory system for OpenCode with full automation and local vector search

## Installation

```bash
# Install latest version
npm install @csuwl/opencode-memory-plugin -g

# Or install a specific version
npm install -g @csuwl/opencode-memory-plugin@1.0.0

# Or install locally without -g
npm install @csuwl/opencode-memory-plugin
```

The plugin will be automatically configured for you!

## Features

- 9 core memory files (OpenClaw-style)
- 8 memory tools (write, read, search, vector search)
- 2 automation agents (auto-save, auto-consolidate)
- Daily memory logs with automatic consolidation
- Semantic search using local embeddings

## Usage

After installation, all memory tools are available in OpenCode:

```bash
# Write to memory
memory_write content="User prefers TypeScript" type="long-term"

# Search memory
memory_search query="typescript"

# Semantic search
vector_memory_search query="how to handle errors"

# List daily logs
list_daily days=7
```

## Configuration

Memory files are located at `~/.opencode/memory/`:

- `SOUL.md` - AI personality and boundaries
- `AGENTS.md` - Operating instructions
- `USER.md` - User profile and preferences
- `IDENTITY.md` - Assistant identity
- `TOOLS.md` - Tool usage conventions
- `MEMORY.md` - Long-term memory
- And more...

## Documentation

For full documentation, visit: https://github.com/csuwl/opencode-memory-plugin

## License

MIT
