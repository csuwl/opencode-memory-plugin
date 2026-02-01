# Installation Guide

## Simple Installation (No Docker Required)

The OpenCode Memory Plugin is designed to be simple to install and use. You don't need Docker or complex configurations - just run one script!

### Step 1: Download the Plugin

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/opencode-memory-plugin.git
cd opencode-memory-plugin
```

Or download and extract the zip file from GitHub releases.

### Step 2: Run Initialization

```bash
# Run the initialization script
bash scripts/init.sh
```

That's it! The script will:

- ✅ Create memory directories in `~/.opencode/memory/`
- ✅ Copy all memory files (SOUL, AGENTS, USER, etc.)
- ✅ Configure OpenCode to load memory into every session
- ✅ Set up automation agents (@memory-automation, @memory-consolidate)
- ✅ Initialize today's daily log

### Step 3: Start Using OpenCode

OpenCode will now automatically have memory in every session!

```bash
opencode
```

## What Gets Installed?

### Memory Files (9 core files)
- `~/.opencode/memory/SOUL.md` - AI personality and boundaries
- `~/.opencode/memory/AGENTS.md` - Operating instructions
- `~/.opencode/memory/USER.md` - User profile and preferences
- `~/.opencode/memory/IDENTITY.md` - Assistant identity
- `~/.opencode/memory/TOOLS.md` - Tool usage conventions
- `~/.opencode/memory/MEMORY.md` - Long-term memory
- `~/.opencode/memory/HEARTBEAT.md` - Health checklist
- `~/.opencode/memory/BOOT.md` - Startup checklist
- `~/.opencode/memory/BOOTSTRAP.md` - First-run ritual

### Automation Agents (2 agents)
- `@memory-automation` - Automatically saves important information
- `@memory-consolidate` - Organizes and archives daily logs

### Memory Tools (8 tools)
- `memory_write` - Write entries to memory
- `memory_read` - Read from memory files
- `memory_search` - Keyword search across memory
- `vector_memory_search` - Semantic search with embeddings
- `list_daily` - List available daily logs
- `init_daily` - Initialize today's daily log
- `rebuild_index` - Rebuild vector index
- `index_status` - Check vector index status

## Verification

After installation, verify everything is working:

```bash
# Check memory files exist
ls -la ~/.opencode/memory/

# Check OpenCode configuration
cat ~/.config/opencode/opencode.json

# Test memory tools in OpenCode
opencode
# Then try: memory_write content="Test" type="daily"
```

## Troubleshooting

### Permission Errors

If you get permission errors:

```bash
# Make the script executable
chmod +x scripts/init.sh

# Or run with sudo (not recommended)
sudo bash scripts/init.sh
```

### OpenCode Config Not Found

If the script can't find OpenCode config:

```bash
# Create the directory manually
mkdir -p ~/.config/opencode

# Then re-run init.sh
bash scripts/init.sh
```

### Memory Files Already Exist

If you're reinstalling:

```bash
# Backup existing memory
mv ~/.opencode/memory ~/.opencode/memory.backup.$(date +%Y%m%d)

# Re-run init.sh
bash scripts/init.sh
```

## Customization

After installation, you can customize memory files:

```bash
# Edit memory files directly
nano ~/.opencode/memory/SOUL.md
nano ~/.opencode/memory/USER.md

# Or modify OpenCode config
nano ~/.config/opencode/opencode.json
```

## Uninstallation

To remove the plugin:

```bash
# Remove memory directory
rm -rf ~/.opencode/memory

# Remove OpenCode config entries
nano ~/.config/opencode/opencode.json
# Remove the "instructions", "agent", and "tools" sections related to memory
```

## Next Steps

1. **Personalize your memory files**
   - Edit `~/.opencode/memory/USER.md` with your preferences
   - Customize `~/.opencode/memory/SOUL.md` for AI personality

2. **Start using memory tools**
   - Write important information to memory
   - Use semantic search to find past context
   - Let automation agents help manage your memories

3. **Explore advanced features**
   - Vector search with embeddings
   - Daily log consolidation
   - Automatic memory organization

For more information, see the [main README](README.md).
