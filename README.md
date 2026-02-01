# OpenCode Memory Plugin

> OpenClaw-style persistent memory system for OpenCode with full automation and local vector search

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/opencode-memory-plugin/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/opencode-memory-plugin/blob/main)
[![OpenCode](https://img.shields.io/badge/OpenCode-compatible-success.svg)](https://docs.opencode.ai)
[![npm](https://img.shields.io/badge/npm-%40csuwl%2Fopencode--memory--plugin-blue.svg)](https://www.npmjs.com/package/@csuwl/opencode-memory-plugin)
[![Downloads](https://img.shields.io/npm/dt/@csuwl/opencode-memory-plugin)](https://www.npmjs.com/package/@csuwl/opencode-memory-plugin)

## 🎯 Features

- ✅ **OpenClaw-Style Memory System** - Complete 9 core memory files (SOUL, AGENTS, USER, IDENTITY, TOOLS, MEMORY, HEARTBEAT, BOOT, BOOTSTRAP)
- ✅ **Fully Automated** - Automatically saves important information without being asked
- ✅ **Local Vector Search** - Semantic search using local embeddings (sqlite-vec)
- ✅ **Daily Memory Logs** - Running context with automatic consolidation
- ✅ **Long-Term Memory** - Persistent knowledge across sessions and projects
- ✅ **Hybrid Search** - BM25 + vector search for optimal results
- **2 Automation Agents**:
  - `@memory-automation` - Auto-saves important information
  - `@memory-consolidate` - Auto-organizes daily logs
- **8 Memory Tools**:
  - `memory_write` - Write entries to memory
  - `memory_read` - Read from memory files
  - `memory_search` - Keyword search across memory
  - `vector_memory_search` - Semantic search with embeddings
  - `list_daily` - List available daily logs
  - `init_daily` - Initialize today's daily log
  - `rebuild_index` - Rebuild vector index
  - `index_status` - Check vector index status

## 📦 Quick Start

### Prerequisites

- OpenCode v1.1.48 or later
- Node.js 20+ (for development)

### Installation

#### Method 1: NPM Installation (Recommended - Easiest!)

```bash
# Install latest version from npm registry
npm install @csuwl/opencode-memory-plugin -g

# Or install a specific version
npm install -g @csuwl/opencode-memory-plugin@1.0.0

# That's it! The plugin will be automatically configured for you! 🧠
```

The npm installation automatically:
- ✅ Creates memory directory structure (`~/.opencode/memory/`)
- ✅ Copies all 9 memory files
- ✅ Configures OpenCode to load memory into every session
- ✅ Sets up automation agents
- ✅ Initializes today's daily log

**No manual configuration needed!**

#### Method 2: Manual Installation from Git

```bash
# Clone repository
git clone https://github.com/csuwl/opencode-memory-plugin.git
cd opencode-memory-plugin

# Run initialization script
bash opencode-memory-plugin/scripts/init.sh

# That's it! Your OpenCode now has memory 🧠
```

The initialization script will:
1. Create memory directory structure
2. Copy all memory files to `~/.opencode/memory/`
3. Configure OpenCode to load memory into every session
4. Set up automation agents
5. Initialize today's daily log

### Usage

The plugin automatically configures OpenCode to load memory files into every session:

**Memory files injected:**
- `SOUL.md` - AI personality and boundaries
- `AGENTS.md` - Operating instructions and memory rules
- `USER.md` - User profile and preferences
- `IDENTITY.md` - Assistant identity
- `TOOLS.md` - Tool usage conventions
- `MEMORY.md` - Long-term memory
- Plus today's daily log

### Available Tools

```bash
# In OpenCode, try these commands:

# Write a memory entry
memory_write content="User prefers TypeScript for all new features" type="long-term" tags=["typescript","code-style"]

# Search for past information
memory_search query="async patterns"

# Semantic search
vector_memory_search query="how do I handle async errors"

# List recent daily logs
list_daily days=7

# Initialize today's log
init_daily

# Check vector index status
index_status

# Rebuild vector index
rebuild_index force=true
```

### Using Automation Agents

```bash
# Auto-save important information
@memory-automation review conversation and save important information

# Organize daily logs
@memory-consolidate review and consolidate recent memories
```

## 📖 Project Structure

```
opencode-memory-plugin/
├── memory/              # Core memory files (OpenClaw style)
│   ├── SOUL.md            # Personality, tone, boundaries
│   ├── AGENTS.md          # Operating instructions
│   ├── USER.md            # User profile
│   ├── IDENTITY.md        # Assistant identity
│   ├── TOOLS.md           # Tool conventions
│   ├── MEMORY.md          # Long-term memory
│   ├── HEARTBEAT.md       # Health checklist
│   ├── BOOT.md            # Startup checklist
│   ├── BOOTSTRAP.md       # One-time ritual
│   └── daily/             # Daily logs
├── tools/               # Custom OpenCode tools
│   ├── memory.ts            # Basic memory tools
│   └── vector-memory.ts     # Vector search tools
├── agents/              # Custom OpenCode agents
│   ├── memory-automation.md    # Auto-save agent
│   └── memory-consolidate.md   # Auto-consolidate agent
├── scripts/             # Utility scripts
│   └── init.sh              # Installation script
└── package.json           # NPM package configuration
```

## 🔧 Development

### Adding New Tools

1. Create a new tool in `tools/` directory
2. Export the tool using `tool()` helper
3. Update `agents/` to use the new tool

### Example Tool

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({

  description: "Your tool description",

  args: {
    query: tool.schema.string().describe("Your parameter description"),
  },

  async execute(args, context) {
    // Your tool logic here
    return `Result: ${args.query}`
  },

})
```

### Adding New Agents

1. Create agent markdown file in `agents/`
2. Configure permissions and tools
3. Add to `package.json` or create a PR

## 📝 Configuration

Memory system configuration is stored in:

- `~/.opencode/memory/memory-config.json`
- `~/.opencode/memory/MEMORY.md` - Long-term memory
- `~/.opencode/memory/daily/YYYY-MM-DD.md` - Daily logs
- `~/.opencode/memory/archive/` - Archived logs

OpenCode configuration is in:

- `~/.config/opencode/opencode.json` - Memory tools and agents

## 🔧 Troubleshooting

### Memory files not loading
1. Check OpenCode config: `cat ~/.config/opencode/opencode.json`
2. Verify file paths are correct
3. Restart OpenCode if needed

### Vector search not working
1. Check vector index: `index_status`
2. Rebuild if needed: `rebuild_index force=true`
3. Check `memory-config.json` settings

### Daily logs not creating
1. Check directory: `ls ~/.opencode/memory/daily/`
2. Manually initialize: `init_daily`
3. Check permissions

## 📚 Documentation

- [OpenCode Docs](https://docs.opencode.ai) - Official OpenCode documentation
- [OpenClaw Docs](https://docs.openclaw.ai) - Reference for OpenClaw-style memory system

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues** - Open an issue on GitHub for bugs or feature requests
2. **Submit Pull Requests** - Fork the repository and create a pull request
3. **Improve Documentation** - Help improve README and examples
4. **Add Features** - Add new tools or agents
5. **Share Ideas** - Suggest improvements or new use cases

### Development Guidelines

- Follow OpenCode plugin conventions
- Use TypeScript for tools
- Test changes thoroughly
- Update documentation with new features
- Respect the memory-first approach

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- OpenClaw team for the memory system design
- OpenCode team for the plugin system
- All contributors and users

---

**Made with ❤️ for OpenCode community**

*Your OpenCode instance now has perfect memory - just like OpenClaw!* 🧠
