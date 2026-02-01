#!/bin/bash

# OpenClaw-Style Memory System for OpenCode - Initialization Script
# This script sets up the complete memory system with all necessary files and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
MEMORY_ROOT="$HOME/.opencode"
MEMORY_DIR="$MEMORY_ROOT/memory"
DAILY_DIR="$MEMORY_DIR/daily"
VECTOR_DB="$MEMORY_DIR/vector-index.db"
MEMORY_CONFIG="$MEMORY_DIR/memory-config.json"

# OpenCode config directory
OPENCODE_CONFIG_DIR="$HOME/.config/opencode"
OPENCODE_CONFIG="$OPENCODE_CONFIG_DIR/opencode.json"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  OpenCode Memory Plugin - Initialization${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Create directory structure
echo -e "${YELLOW}Step 1/7: Creating memory directory structure...${NC}"
mkdir -p "$MEMORY_DIR"
mkdir -p "$DAILY_DIR"
mkdir -p "$MEMORY_DIR/archive/weekly"
mkdir -p "$MEMORY_DIR/archive/monthly"
echo -e "${GREEN}✓ Directory structure created${NC}"
echo ""

# Step 2: Copy memory files
echo -e "${YELLOW}Step 2/7: Copying memory files...${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

# Copy files if they don't exist
FILES=(
  "SOUL.md"
  "AGENTS.md"
  "USER.md"
  "IDENTITY.md"
  "TOOLS.md"
  "MEMORY.md"
  "HEARTBEAT.md"
  "BOOT.md"
  "BOOTSTRAP.md"
)

for file in "${FILES[@]}"; do
  SOURCE="$PLUGIN_DIR/memory/$file"
  DEST="$MEMORY_DIR/$file"
  
  if [ ! -f "$DEST" ]; then
    if [ -f "$SOURCE" ]; then
      cp "$SOURCE" "$DEST"
      echo -e "  ${GREEN}✓${NC} Created: $file"
    else
      echo -e "  ${RED}✗${NC} Missing: $SOURCE"
    fi
  else
    echo -e "  ${BLUE}⊙${NC} Exists: $file (skipped)"
  fi
done

echo -e "${GREEN}✓ Memory files copied${NC}"
echo ""

# Step 3: Create memory configuration
echo -e "${YELLOW}Step 3/7: Creating memory configuration...${NC}"
cat > "$MEMORY_CONFIG" << 'EOF'
{
  "version": "1.0.0",
  "auto_save": true,
  "auto_save_threshold_tokens": 1000,
  "vector_search": {
    "enabled": true,
    "hybrid": true,
    "rebuild_interval_hours": 24
  },
  "consolidation": {
    "enabled": true,
    "run_daily": true,
    "run_hour": 23,
    "archive_days": 30,
    "delete_days": 90
  },
  "git_backup": {
    "enabled": false,
    "auto_commit": false,
    "auto_push": false
  },
  "retention": {
    "max_daily_files": 30,
    "max_entries_per_file": 100,
    "chunk_size": 400,
    "chunk_overlap": 80
  }
}
EOF

echo -e "${GREEN}✓ Configuration created${NC}"
echo ""

# Step 4: Configure OpenCode to use memory
echo -e "${YELLOW}Step 4/7: Configuring OpenCode to use memory...${NC}"

# Ensure OpenCode config directory exists
mkdir -p "$OPENCODE_CONFIG_DIR"

# Backup existing config
if [ -f "$OPENCODE_CONFIG" ]; then
  BACKUP="${OPENCODE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$OPENCODE_CONFIG" "$BACKUP"
  echo -e "  ${BLUE}⊙${NC} Backed up existing config to: $(basename "$BACKUP")"
fi

  # Create or update OpenCode config
  if [ ! -f "$OPENCODE_CONFIG" ]; then
  # Create new config
  cat > "$OPENCODE_CONFIG" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "~/.opencode/memory/SOUL.md",
    "~/.opencode/memory/AGENTS.md",
    "~/.opencode/memory/USER.md",
    "~/.opencode/memory/IDENTITY.md",
    "~/.opencode/memory/TOOLS.md",
    "~/.opencode/memory/MEMORY.md"
  ],
  "agent": {
    "memory-automation": {
      "description": "Automatically saves important information to memory",
      "mode": "subagent",
      "tools": {
        "memory_write": true,
        "memory_read": true,
        "memory_search": true,
        "vector_memory_search": true
      },
      "permission": {
        "memory_write": "allow",
        "memory_read": "allow",
        "memory_search": "allow",
        "vector_memory_search": "allow"
      }
    },
    "memory-consolidate": {
      "description": "Consolidates daily logs into long-term memory",
      "mode": "subagent",
      "tools": {
        "memory_write": true,
        "memory_read": true,
        "memory_search": true,
        "vector_memory_search": true,
        "list_daily": true,
        "rebuild_index": true
      },
      "permission": {
        "memory_write": "allow",
        "memory_read": "allow",
        "memory_search": "allow",
        "vector_memory_search": "allow",
        "list_daily": "allow",
        "rebuild_index": "allow"
      }
    }
  },
  "permission": {
    "bash": "ask",
    "edit": "ask",
    "write": "ask"
  },
  "tools": {
    "memory_write": true,
    "memory_read": true,
    "memory_search": true,
    "vector_memory_search": true,
    "list_daily": true,
    "init_daily": true,
    "rebuild_index": true,
    "index_status": true
  }
}
EOF'
  echo -e "  ${GREEN}✓${NC} Created OpenCode config"
  else
  # Update existing config - add instructions and tools if not present
  echo -e "  ${BLUE}⊙${NC} Updating existing OpenCode config..."
  
  # This is a simplified update - in production, we'd use jq or a proper JSON parser
  if [ -f "$OPENCODE_CONFIG" ] && ! grep -q "instructions" "$OPENCODE_CONFIG"; then
    # Add instructions section before the closing brace
    TEMP_FILE=$(mktemp)
    # Read everything except the last line (the closing })
    head -n -1 "$OPENCODE_CONFIG" > "$TEMP_FILE"
    
    # Add instructions and agents
    cat >> "$TEMP_FILE" << 'EOF'
  "instructions": [
    "~/.opencode/memory/SOUL.md",
    "~/.opencode/memory/AGENTS.md",
    "~/.opencode/memory/USER.md",
    "~/.opencode/memory/IDENTITY.md",
    "~/.opencode/memory/TOOLS.md",
    "~/.opencode/memory/MEMORY.md"
  ],
EOF'
    
    # Add closing brace
    echo "}" >> "$TEMP_FILE"
    
    # Replace original file
    mv "$TEMP_FILE" "$OPENCODE_CONFIG"
    echo -e "    ${GREEN}✓${NC} Added memory instructions"
  else
    echo -e "    ${YELLOW}⚠${NC} Could not update config or instructions already exist"
  fi
  
  # Check if tools are configured
  if ! grep -q '"memory_write"' "$OPENCODE_CONFIG"; then
    echo -e "    ${YELLOW}⚠${NC} Memory tools not fully configured. Please manually add tools to opencode.json."
  fi
fi

echo -e "${GREEN}✓ OpenCode configuration updated${NC}"
echo ""

# Step 5: Initialize daily log for today
echo -e "${YELLOW}Step 5/7: Initializing today's daily log...${NC}"
TODAY=$(date +%Y-%m-%d)
TODAY_FILE="$DAILY_DIR/$TODAY.md"

if [ ! -f "$TODAY_FILE" ]; then
  cat > "$TODAY_FILE" << EOF
# Daily Memory Log - $TODAY

*Session starts: $(date +%Y-%m-%dT%H:%M:%S)*

## Notes

## Tasks

## Learnings

---
EOF
  echo -e "  ${GREEN}✓${NC} Created today's daily log: $TODAY.md"
else
  echo -e "  ${BLUE}⊙${NC} Daily log already exists: $TODAY.md"
fi

echo ""

# Step 6: Install plugin dependencies
echo -e "${YELLOW}Step 6/7: Installing plugin dependencies...${NC}"
cd "$PLUGIN_DIR"

if [ -f "package.json" ]; then
  if command -v npm &> /dev/null; then
    npm install
    echo -e "  ${GREEN}✓${NC} Dependencies installed"
  elif command -v pnpm &> /dev/null; then
    pnpm install
    echo -e "  ${GREEN}✓${NC} Dependencies installed"
  elif command -v bun &> /dev/null; then
    bun install
    echo -e "  ${GREEN}✓${NC} Dependencies installed"
  else
    echo -e "  ${RED}✗${NC} No package manager found (npm/pnpm/bun). Please install dependencies manually."
  fi
else
  echo -e "  ${YELLOW}⚠${NC} No package.json found. Skipping dependency installation."
fi

echo ""

# Step 7: Final summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Memory system initialized successfully!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Memory System Structure:${NC}"
echo -e "  ${BLUE}📁${NC} ~/.opencode/memory/"
echo -e "    ├── SOUL.md          ${GREEN}(personality & boundaries)${NC}"
echo -e "    ├── AGENTS.md        ${GREEN}(operating instructions)${NC}"
echo -e "    ├── USER.md          ${GREEN}(user profile)${NC}"
echo -e "    ├── IDENTITY.md      ${GREEN}(assistant identity)${NC}"
echo -e "    ├── TOOLS.md         ${GREEN}(tool conventions)${NC}"
echo -e "    ├── MEMORY.md        ${GREEN}(long-term memory)${NC}"
echo -e "    ├── HEARTBEAT.md     ${GREEN}(health checklist)${NC}"
echo -e "    ├── BOOT.md          ${GREEN}(startup checklist)${NC}"
echo -e "    ├── BOOTSTRAP.md     ${GREEN}(first-run ritual)${NC}"
echo -e "    ├── daily/           ${GREEN}(daily logs)${NC}"
echo -e "    ├── archive/weekly/   ${GREEN}(archived weekly logs)${NC}"
echo -e "    └── archive/monthly/ ${GREEN}(archived monthly logs)${NC}"
echo ""
echo -e "${YELLOW}Available Agents:${NC}"
echo -e "  ${BLUE}🤖${NC} @memory-automation     ${GREEN}(auto-saves important info)${NC}"
echo -e "  ${BLUE}🤖${NC} @memory-consolidate  ${GREEN}(organizes & archives)${NC}"
echo ""
echo -e "${YELLOW}Memory Tools:${NC}"
echo -e "  ${BLUE}🔧${NC} memory_write         ${GREEN}(save memories)${NC}"
echo -e "  ${BLUE}🔧${NC} memory_read          ${GREEN}(read memories)${NC}"
echo -e "  ${BLUE}🔧${NC} memory_search        ${GREEN}(keyword search)${NC}"
echo -e "  ${BLUE}🔧${NC} vector_memory_search ${GREEN}(semantic search)${NC}"
echo -e "  ${BLUE}🔧${NC} list_daily           ${GREEN}(list daily logs)${NC}"
echo -e "  ${BLUE}🔧${NC} init_daily           ${GREEN}(init daily log)${NC}"
echo -e "  ${BLUE}🔧${NC} rebuild_index        ${GREEN}(rebuild vector index)${NC}"
echo -e "  ${BLUE}🔧${NC} index_status         ${GREEN}(check index status)${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Review and personalize your memory files in: ${BLUE}$MEMORY_DIR${NC}"
echo -e "  2. Start OpenCode and use: ${BLUE}init_daily${NC} to initialize today's log"
echo -e "  3. Test memory tools: ${BLUE}memory_write content='Test memory' type='daily'${NC}"
echo -e "  4. Search memory: ${BLUE}vector_memory_search query='test'${NC}"
echo -e "  5. Run consolidation: ${BLUE}@memory-consolidate review and consolidate recent memories${NC}"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo -e "  • Memory files are automatically injected into every OpenCode session"
echo -e "  • The system automatically saves important information (fully automated)"
echo -e "  • Daily logs are consolidated into long-term memory periodically"
echo -e "  • Vector search provides semantic memory retrieval"
echo -e "  • Review ${BLUE}BOOTSTRAP.md${NC} in $MEMORY_DIR for the first-run ritual"
echo ""
echo -e "${BLUE}🎉 Your OpenCode instance now has perfect memory! 🧠${NC}"
echo ""
