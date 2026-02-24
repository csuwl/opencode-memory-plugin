#!/bin/bash

# 本地测试脚本 - 不需要 Docker
# 测试 OpenCode Memory Plugin 的本地 embedding 功能

set -e

MEMORY_DIR="$HOME/.opencode/memory-test"
CONFIG_FILE="$MEMORY_DIR/memory-config.json"

echo "========================================"
echo "OpenCode Memory Plugin - 本地 Embedding 测试"
echo "========================================"
echo ""

# 清理旧的测试数据
echo "🧹 清理旧的测试数据..."
rm -rf "$MEMORY_DIR"
mkdir -p "$MEMORY_DIR/daily"

# 复制配置文件
echo "📝 步骤 1: 创建配置文件（本地模式）..."
cat > "$CONFIG_FILE" << EOF
{
  "embedding": {
    "provider": "none",
    "cacheEnabled": true
  },
  "autoIndex": false,
  "indexing": {
    "chunkSize": 400,
    "chunkOverlap": 80
  }
}
EOF
echo "✓ 配置文件创建完成"
echo ""

# 创建测试记忆
echo "📝 步骤 2: 创建测试记忆..."
cat > "$MEMORY_DIR/MEMORY.md" << 'EOF'
# MEMORY.md - 长期记忆

## [2026-02-24] 用户偏好

用户喜欢使用 TypeScript 进行开发。
偏好清晰的代码注释。
注重代码可维护性。

## [2026-02-24] 项目背景

正在开发 opencode-memory-plugin 项目。
这是一个为 OpenCode 添加持久化记忆系统的插件。
目标是实现类似 OpenClaw 的记忆功能。

## [2026-02-24] 技术栈

后端: TypeScript + Node.js
数据库: SQLite (better-sqlite3)
向量搜索: 本地 embedding 或 OpenAI API
配置管理: JSON 配置文件

## [2026-02-24] 测试记录

本文件用于测试本地 embedding 功能。
不依赖 OpenAI API，使用 hash-based embedding。
EOF
echo "✓ 测试记忆创建完成"
echo ""

# 进入插件目录
cd /Users/wl/opencode-memory-plugin/opencode-memory-plugin

echo "🧪 步骤 3: 测试配置加载..."
node --loader ts-node/esm << 'EOF'
import { loadConfig } from './tools/config.ts';

async function test() {
  const config = await loadConfig();
  console.log('✓ 配置加载成功');
  console.log(`  Provider: ${config.embedding.provider}`);
  console.log(`  Auto Index: ${config.autoIndex}`);
  console.log(`  Chunk Size: ${config.indexing.chunkSize}`);
  console.log(`  Cache Enabled: ${config.embedding.cacheEnabled}`);
}

test().catch(err => {
  console.error('✗ 配置加载失败:', err.message);
  process.exit(1);
});
EOF
echo ""

echo "🧮 步骤 4: 测试本地 embedding 生成..."
node --loader ts-node/esm << 'EOF'
import { getEmbedding } from './tools/embeddings.ts';
import { loadConfig } from './tools/config.ts';

async function test() {
  const config = await loadConfig();
  const testText = "用户喜欢 TypeScript 和清晰的代码注释";

  console.log('测试文本:', testText);
  const embedding = await getEmbedding(testText, config);

  console.log('✓ Embedding 生成成功');
  console.log(`  维度: ${embedding.length}`);
  console.log(`  前5个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
  console.log(`  范围: [${Math.min(...embedding).toFixed(4)}, ${Math.max(...embedding).toFixed(4)}]`);
}

test().catch(err => {
  console.error('✗ Embedding 生成失败:', err.message);
  process.exit(1);
});
EOF
echo ""

echo "💾 步骤 5: 测试向量索引创建..."
node --loader ts-node/esm << 'EOF'
import Database from 'better-sqlite3';
import path from 'path';
import { readFile } from 'fs/promises';

const MEMORY_DIR = process.env.HOME + '/.opencode/memory-test';
const DB_PATH = path.join(MEMORY_DIR, 'vector-index.db');
const MEMORY_PATH = path.join(MEMORY_DIR, 'MEMORY.md');

async function test() {
  const db = new Database(DB_PATH);

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      chunk TEXT NOT NULL,
      line_start INTEGER NOT NULL,
      line_end INTEGER NOT NULL,
      embedding BLOB,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    )
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
      chunk,
      content='memory_chunks',
      content_rowid='id'
    )
  `);

  console.log('✓ 向量索引表创建成功');

  // 读取记忆文件
  const content = await readFile(MEMORY_PATH, 'utf-8');
  const lines = content.split('\n');

  // 分块
  const chunks = [];
  let currentChunk = [];
  let startLine = 0;
  const CHUNK_SIZE = 400;
  const CHUNK_OVERLAP = 80;

  for (let i = 0; i < lines.length; i++) {
    currentChunk.push(lines[i]);

    const currentSize = currentChunk.join('\n').length;
    const targetSize = CHUNK_SIZE * 4;

    if (currentSize >= targetSize && currentChunk.length > CHUNK_OVERLAP / 4) {
      const endLine = i + 1;
      chunks.push({
        chunk: currentChunk.join('\n'),
        line_start: startLine,
        line_end: endLine
      });

      const overlapLines = Math.floor(CHUNK_OVERLAP / 4);
      currentChunk = currentChunk.slice(-overlapLines);
      startLine = i - overlapLines + 1;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push({
      chunk: currentChunk.join('\n'),
      line_start: startLine,
      line_end: lines.length
    });
  }

  console.log(`✓ 文本分块完成: ${chunks.length} 个 chunks`);

  // 生成 hash-based embedding
  async function hashEmbedding(text, dimensions = 384) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = [];

    for (let i = 0; i < dimensions; i++) {
      let hash = 0;
      for (let j = 0; j < words.length; j++) {
        const word = words[j];
        for (let k = 0; k < word.length; k++) {
          hash = ((hash << 5) - hash) + word.charCodeAt(k);
          hash |= 0;
        }
      }
      embedding.push((hash % 1000) / 1000);
    }

    return embedding;
  }

  // 索引所有 chunks
  let indexed = 0;
  for (const chunkData of chunks) {
    const embedding = await hashEmbedding(chunkData.chunk);

    db.prepare(`
      INSERT INTO memory_chunks (file_path, chunk, line_start, line_end, embedding, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'MEMORY.md',
      chunkData.chunk,
      chunkData.line_start,
      chunkData.line_end,
      JSON.stringify(embedding),
      JSON.stringify({ file: 'MEMORY.md', lines: `${chunkData.line_start}-${chunkData.line_end}` })
    );

    indexed++;
  }

  console.log(`✓ 索引完成: ${indexed} 个 chunks`);
  db.close();
}

test().catch(err => {
  console.error('✗ 索引创建失败:', err.message);
  process.exit(1);
});
EOF
echo ""

echo "🔍 步骤 6: 测试向量搜索..."
node --loader ts-node/esm << 'EOF'
import Database from 'better-sqlite3';
import path from 'path';

const MEMORY_DIR = process.env.HOME + '/.opencode/memory-test';
const DB_PATH = path.join(MEMORY_DIR, 'vector-index.db');

async function test() {
  const db = new Database(DB_PATH, { readonly: true });

  // Hash-based embedding
  async function hashEmbedding(text, dimensions = 384) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = [];

    for (let i = 0; i < dimensions; i++) {
      let hash = 0;
      for (let j = 0; j < words.length; j++) {
        const word = words[j];
        for (let k = 0; k < word.length; k++) {
          hash = ((hash << 5) - hash) + word.charCodeAt(k);
          hash |= 0;
        }
      }
      embedding.push((hash % 1000) / 1000);
    }

    return embedding;
  }

  function cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // 测试搜索
  const queries = [
    "TypeScript",
    "代码注释",
    "项目目标"
  ];

  for (const query of queries) {
    console.log(`\n查询: "${query}"`);

    const queryEmbedding = await hashEmbedding(query);
    const rows = db.prepare(`
      SELECT file_path, chunk, line_start, line_end, embedding
      FROM memory_chunks
    `).all();

    const results = [];
    for (const row of rows) {
      const similarity = cosineSimilarity(queryEmbedding, JSON.parse(row.embedding));
      results.push({
        file: row.file_path,
        snippet: row.chunk.substring(0, 150).replace(/\n/g, ' '),
        score: similarity,
        line_start: row.line_start,
        line_end: row.line_end
      });
    }

    results.sort((a, b) => b.score - a.score);

    console.log(`  找到 ${results.length} 个结果`);

    results.slice(0, 2).forEach((r, i) => {
      const scorePercent = (r.score * 100).toFixed(1);
      console.log(`\n  ${i + 1}. [${r.file} Lines ${r.line_start}-${r.line_end}]`);
      console.log(`     相关性: ${scorePercent}%`);
      console.log(`     ${r.snippet}...`);
    });
  }

  db.close();
}

test().catch(err => {
  console.error('✗ 搜索测试失败:', err.message);
  process.exit(1);
});
EOF
echo ""

echo "📊 步骤 7: 检查测试结果..."
echo ""
echo "数据库文件:"
ls -lh "$MEMORY_DIR/vector-index.db" 2>/dev/null || echo "  ✗ 数据库文件不存在"
echo ""
echo "记忆文件:"
ls -lh "$MEMORY_DIR/"*.md 2>/dev/null || echo "  ✗ 记忆文件不存在"
echo ""

# 最终总结
echo "========================================"
echo "✅ 本地 Embedding 测试完成！"
echo "========================================"
echo ""
echo "测试总结:"
echo "  ✓ 配置文件创建"
echo "  ✓ 测试记忆生成"
echo "  ✓ 配置加载测试"
echo "  ✓ 本地 embedding 生成"
echo "  ✓ 向量索引创建"
echo "  ✓ 向量搜索功能"
echo ""
echo "测试数据位置: $MEMORY_DIR"
echo "配置文件: $CONFIG_FILE"
echo "数据库: $MEMORY_DIR/vector-index.db"
echo ""
echo "💡 提示:"
echo "  - 本地模式使用 hash-based embedding"
echo "  - 不需要 OpenAI API key"
echo "  - 适合离线测试和开发"
echo "  - 生产环境建议使用 OpenAI embedding"
echo ""
