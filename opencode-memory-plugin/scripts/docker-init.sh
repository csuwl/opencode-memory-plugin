#!/bin/sh

# OpenClaw-Style Memory System for OpenCode - Docker Initialization Script
# This script sets up memory system inside Docker container

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths (Docker environment)
MEMORY_ROOT="/root/.opencode"
MEMORY_DIR="$MEMORY_ROOT/memory"
DAILY_DIR="$MEMORY_DIR/daily"

echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  OpenCode Memory Plugin - Docker Initialization${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Create directory structure
echo -e "${YELLOW}Step 1/5: Creating memory directory structure...${NC}"
mkdir -p "$MEMORY_DIR"
mkdir -p "$DAILY_DIR"
mkdir -p "$MEMORY_DIR/archive/weekly"
mkdir -p "$MEMORY_DIR/archive/monthly"
echo -e "${GREEN}✓${NC} Directory structure created"
echo ""

# Step 2: Copy memory files
echo -e "${YELLOW}Step 2/5: Copying memory files...${NC}"

# Get script directory - sh compatible way
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PLUGIN_DIR=$(dirname "$SCRIPT_DIR")

# Copy files if they don't exist
FILES="SOUL.md AGENTS.md USER.md IDENTITY.md TOOLS.md MEMORY.md HEARTBEAT.md BOOT.md BOOTSTRAP.md"
for file in $FILES; do
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

echo -e "${GREEN}✓${NC} Memory files copied"
echo ""

# Step 3: Create memory configuration
echo -e "${YELLOW}Step 3/5: Creating memory configuration...${NC}"
# Create OpenCode config directory
OPENCORE_CONFIG_DIR="/root/.config/opencode"
mkdir -p "$OPENCORE_CONFIG_DIR"
MEMORY_CONFIG="$OPENCORE_CONFIG_DIR/opencode.json"
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

echo -e "${GREEN}✓${NC} Configuration created"
echo ""

# Step 4: Initialize daily log for today
echo -e "${YELLOW}Step 4/5: Initializing today's daily log...${NC}"
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

# Step 5: Summary
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓${NC} Memory system initialized successfully!"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Memory System Structure:${NC}"
echo -e "  ${BLUE}📁${NC} /root/.opencode/memory/"
echo -e "    ├── SOUL.md          ${GREEN}(personality & boundaries)${NC}"
echo -e "    ├── AGENTS.md        ${GREEN}(operating instructions)${NC}"
echo -e "    ├── USER.md          ${GREEN}(user profile)${NC}"
echo -e "    ├── IDENTITY.md      ${GREEN}(assistant identity)${NC}"
echo -e "    ├── TOOLS.md         ${GREEN}(tool conventions)${NC}"
echo -e "    ├── MEMORY.md        ${GREEN}(long-term memory)${NC}"
echo -e "    ├── daily/           ${GREEN}(daily logs)${NC}"
echo -e "    └── archive/         ${GREEN}(archived logs)${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Start OpenCode with: ${BLUE}opencode${NC}"
echo -e "  2. Test memory tools:"
echo -e "     ${BLUE}memory_write content='Test memory' type='daily'${NC}"
echo -e "     ${BLUE}memory_search query='test'${NC}"
echo -e "     ${BLUE}vector_memory_search query='test'${NC}"
echo -e "  3. Test automation agents:"
echo -e "     ${BLUE}@memory-automation review and save important information${NC}"
echo -e "     ${BLUE}@memory-consolidate review and consolidate recent memories${NC}"
echo ""
echo -e "${BLUE}🎉${NC} Memory system ready! 🧠"
echo ""
