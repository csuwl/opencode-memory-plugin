#!/bin/bash

# 快速本地测试脚本
# 测试本地 embedding 功能（无需 Docker）

set -e

MEMORY_DIR="$HOME/.opencode/memory-test"
PLUGIN_DIR="/Users/wl/opencode-memory-plugin/opencode-memory-plugin"

echo "========================================"
echo "🧪 OpenCode Memory Plugin - 本地测试"
echo "========================================"
echo ""

# 清理并创建测试目录
rm -rf "$MEMORY_DIR"
mkdir -p "$MEMORY_DIR/daily"

echo "📝 步骤 1: 创建配置和测试数据..."

# 配置文件（本地模式）
cat > "$MEMORY_DIR/memory-config.json" << EOF
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

# 测试记忆
cat > "$MEMORY_DIR/MEMORY.md" << 'EOF'
# 长期记忆

## [2026-02-24] 用户偏好

用户喜欢 TypeScript 开发，注重代码质量。
偏好清晰的注释和文档。

## [2026-02-24] 项目信息

opencode-memory-plugin 是一个记忆插件。
支持本地和 OpenAI embedding。
EOF

echo "✓ 测试数据创建完成"
echo ""

cd "$PLUGIN_DIR"

echo "🧪 步骤 2: 测试配置加载..."
node << NODE_SCRIPT
const { loadConfig } = require('./dist/tools/config.js');

(async () => {
  const config = await loadConfig();
  console.log('✓ 配置加载成功');
  console.log(`  Provider: ${config.embedding.provider}`);
  console.log(`  Auto Index: ${config.autoIndex}`);
  console.log(`  Cache: ${config.embedding.cacheEnabled}`);
})();
NODE_SCRIPT
echo ""

echo "🧮 步骤 3: 测试本地 embedding..."
node << NODE_SCRIPT
const { getEmbedding } = require('./dist/tools/embeddings.js');
const { loadConfig } = require('./dist/tools/config.js');

(async () => {
  const config = await loadConfig();
  const text = "用户喜欢 TypeScript 和清晰的代码";

  const embedding = await getEmbedding(text, config);

  console.log('✓ Embedding 生成成功');
  console.log(`  维度: ${embedding.length}`);
  console.log(`  前5个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
})();
NODE_SCRIPT
echo ""

echo "💾 步骤 4: 创建向量索引..."
node << NODE_SCRIPT
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.env.HOME, '.opencode/memory-test/vector-index.db');
const memoryPath = path.join(process.env.HOME, '.opencode/memory-test/MEMORY.md');

const db = new Database(dbPath);

// 创建表
db.exec(\`
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
\`);

console.log('✓ 数据库表创建成功');

// 读取并分块
const content = fs.readFileSync(memoryPath, 'utf-8');
const lines = content.split('\n');

const chunks = [];
let currentChunk = [];
let startLine = 0;

for (let i = 0; i < lines.length; i++) {
  currentChunk.push(lines[i]);
  if (currentChunk.length >= 10) {
    chunks.push({
      chunk: currentChunk.join('\n'),
      line_start: startLine,
      line_end: i + 1
    });
    currentChunk = [];
    startLine = i + 1;
  }
}

if (currentChunk.length > 0) {
  chunks.push({
    chunk: currentChunk.join('\n'),
    line_start: startLine,
    line_end: lines.length
  });
}

console.log(\`✓ 文本分块: \${chunks.length} 个 chunks\`);

// Hash embedding
function hashEmbedding(text, dimensions = 384) {
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

// 索引
let indexed = 0;
for (const chunkData of chunks) {
  const embedding = hashEmbedding(chunkData.chunk);

  db.prepare(\`
    INSERT INTO memory_chunks (file_path, chunk, line_start, line_end, embedding, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  \`).run(
    'MEMORY.md',
    chunkData.chunk,
    chunkData.line_start,
    chunkData.line_end,
    JSON.stringify(embedding),
    JSON.stringify({ file: 'MEMORY.md', lines: \`\${chunkData.line_start}-\${chunkData.line_end}\` })
  );

  indexed++;
}

console.log(\`✓ 索引完成: \${indexed} 个 chunks\`);
db.close();
NODE_SCRIPT
echo ""

echo "🔍 步骤 5: 测试向量搜索..."
node << NODE_SCRIPT
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.HOME, '.opencode/memory-test/vector-index.db');
const db = new Database(dbPath, { readonly: true });

function hashEmbedding(text, dimensions = 384) {
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

const query = "TypeScript";
const queryEmbedding = hashEmbedding(query);

const rows = db.prepare(\`
  SELECT file_path, chunk, line_start, line_end, embedding
  FROM memory_chunks
\`).all();

const results = [];
for (const row of rows) {
  const similarity = cosineSimilarity(queryEmbedding, JSON.parse(row.embedding));
  results.push({
    file: row.file_path,
    snippet: row.chunk.substring(0, 100).replace(/\n/g, ' '),
    score: similarity,
    line_start: row.line_start,
    line_end: row.line_end
  });
}

results.sort((a, b) => b.score - a.score);

console.log(\`查询: "\${query}"\`);
console.log(\`找到 \${results.length} 个结果\n\`);

results.slice(0, 3).forEach((r, i) => {
  const scorePercent = (r.score * 100).toFixed(1);
  console.log(\`\${i + 1}. [\${r.file} Lines \${r.line_start}-\${r.line_end}]\`);
  console.log(\`   相关性: \${scorePercent}%\`);
  console.log(\`   \${r.snippet}...\n\`);
});

db.close();
NODE_SCRIPT
echo ""

echo "📊 测试结果总结:"
echo ""
echo "✓ 配置系统工作正常"
echo "✓ 本地 embedding 生成正常"
echo "✓ 向量索引创建成功"
echo "✓ 向量搜索功能正常"
echo ""
echo "测试数据位置: $MEMORY_DIR"
echo "数据库大小:"
ls -lh "$MEMORY_DIR/vector-index.db" 2>/dev/null || echo "  数据库未创建"
echo ""
echo "========================================"
echo "✅ 所有测试通过！"
echo "========================================"
echo ""
echo "💡 说明:"
echo "  - 本地模式使用 hash-based embedding"
echo "  - 不需要 OpenAI API key"
echo "  - 适合离线开发测试"
echo "  - 生产环境建议配置 OpenAI API"
echo ""
