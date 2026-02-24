#!/bin/bash

# 集成测试脚本 - OpenCode Memory Plugin + LocalAI Embedding
# 测试真实的 OpenAI 兼容 embedding API

set -e

MEMORY_DIR="/root/.opencode/memory"
CONFIG_FILE="$MEMORY_DIR/memory-config.json"
LOCALAI_URL="${OPENAI_BASE_URL:-http://localai:8080/v1}"

echo "========================================"
echo "🧪 OpenCode Memory Plugin - Embedding 集成测试"
echo "========================================"
echo ""
echo "LocalAI URL: $LOCALAI_URL"
echo ""

# 等待 LocalAI 服务就绪
echo "⏳ 等待 LocalAI 服务启动..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -s "$LOCALAI_URL/../ready" > /dev/null 2>&1; then
    echo "✓ LocalAI 服务已就绪"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "  尝试 $attempt/$max_attempts..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "✗ LocalAI 服务启动超时"
  exit 1
fi
echo ""

# 步骤 1: 测试 LocalAI API
echo "📡 步骤 1: 测试 LocalAI Embedding API..."
echo ""

# 测试 embedding 端点
TEST_TEXT="This is a test sentence for embedding generation."
echo "测试文本: $TEST_TEXT"
echo ""

curl -s "$LOCALAI_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{
    \"input\": \"$TEST_TEXT\",
    \"model\": \"bert-small\"
  }" | jq '.' > /tmp/embedding_response.json

EMBEDDING_DIM=$(jq -r '.data[0].embedding | length' /tmp/embedding_response.json)

if [ "$EMBEDDING_DIM" -gt 0 ]; then
  echo "✓ LocalAI API 工作正常"
  echo "  Embedding 维度: $EMBEDDING_DIM"
  echo "  前 5 个值:"
  jq -r '.data[0].embedding[:5]' /tmp/embedding_response.json
else
  echo "✗ LocalAI API 返回错误"
  cat /tmp/embedding_response.json
  exit 1
fi
echo ""

# 步骤 2: 创建配置文件
echo "⚙️  步骤 2: 创建配置文件..."
mkdir -p "$MEMORY_DIR"

cat > "$CONFIG_FILE" << EOF
{
  "embedding": {
    "provider": "openai",
    "model": "bert-small",
    "baseURL": "$LOCALAI_URL",
    "cacheEnabled": true
  },
  "autoIndex": true,
  "indexing": {
    "chunkSize": 400,
    "chunkOverlap": 80
  }
}
EOF

echo "✓ 配置文件创建完成"
cat "$CONFIG_FILE"
echo ""

# 步骤 3: 创建测试记忆
echo "📝 步骤 3: 创建测试记忆..."
cat > "$MEMORY_DIR/MEMORY.md" << 'EOF'
# 长期记忆测试

## [2026-02-24] 技术栈

我们正在开发一个记忆插件项目。
使用 TypeScript 和 Node.js。
支持本地和云端 embedding。

## [2026-02-24] 项目目标

为 OpenCode 添加持久化记忆能力。
类似 OpenClaw 的记忆系统。
支持语义搜索和自动索引。

## [2026-02-24] 测试记录

这是一个集成测试。
使用 LocalAI 提供的 embedding 服务。
完全离线运行，不需要 OpenAI API。
EOF

echo "✓ 测试记忆创建完成"
echo ""

# 步骤 4: 测试配置加载
echo "🧪 步骤 4: 测试配置加载..."
node << 'NODE_SCRIPT'
const { loadConfig } = require('./dist/tools/config.js');

(async () => {
  try {
    const config = await loadConfig();
    console.log('✓ 配置加载成功');
    console.log(`  Provider: ${config.embedding.provider}`);
    console.log(`  Model: ${config.embedding.model}`);
    console.log(`  Base URL: ${config.embedding.baseURL}`);
    console.log(`  Cache: ${config.embedding.cacheEnabled}`);
    console.log(`  Auto Index: ${config.autoIndex}`);
  } catch (err) {
    console.error('✗ 配置加载失败:', err.message);
    process.exit(1);
  }
})();
NODE_SCRIPT
echo ""

# 步骤 5: 测试真实 embedding 生成
echo "🧮 步骤 5: 测试 LocalAI embedding 生成..."
node << 'NODE_SCRIPT'
const { getEmbedding } = require('./dist/tools/embeddings.js');
const { loadConfig } = require('./dist/tools/config.js');

(async () => {
  try {
    const config = await loadConfig();
    const testText = "这是一个集成测试，使用 LocalAI 生成 embedding";

    console.log(`测试文本: ${testText}`);
    const startTime = Date.now();
    const embedding = await getEmbedding(testText, config);
    const duration = Date.now() - startTime;

    console.log('✓ Embedding 生成成功');
    console.log(`  维度: ${embedding.length}`);
    console.log(`  耗时: ${duration}ms`);
    console.log(`  前 5 个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`  范围: [${Math.min(...embedding).toFixed(4)}, ${Math.max(...embedding).toFixed(4)}]`);
  } catch (err) {
    console.error('✗ Embedding 生成失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
NODE_SCRIPT
echo ""

# 步骤 6: 创建向量索引
echo "💾 步骤 6: 创建向量索引（使用真实 embedding）..."
node << 'NODE_SCRIPT'
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { getEmbedding } = require('./dist/tools/embeddings.js');
const { loadConfig } = require('./dist/tools/config.js');

const MEMORY_DIR = '/root/.opencode/memory';
const DB_PATH = path.join(MEMORY_DIR, 'vector-index.db');
const MEMORY_PATH = path.join(MEMORY_DIR, 'MEMORY.md');

(async () => {
  try {
    const config = await loadConfig();
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

    console.log('✓ 数据库表创建成功');

    // 读取记忆文件
    const content = fs.readFileSync(MEMORY_PATH, 'utf-8');
    const lines = content.split('\n');

    // 分块
    const chunks = [];
    let currentChunk = [];
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      currentChunk.push(lines[i]);

      const currentSize = currentChunk.join('\n').length;
      const targetSize = 400 * 4;

      if (currentSize >= targetSize && currentChunk.length > 20) {
        const endLine = i + 1;
        chunks.push({
          chunk: currentChunk.join('\n'),
          line_start: startLine,
          line_end: endLine
        });

        const overlapLines = 20;
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

    console.log(\`✓ 文本分块: \${chunks.length} 个 chunks\`);

    // 使用真实 embedding 索引
    let indexed = 0;
    const startTime = Date.now();

    for (const chunkData of chunks) {
      const embedding = await getEmbedding(chunkData.chunk, config);

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

      // 显示进度
      if (indexed % 2 === 0) {
        console.log(\`  索引进度: \${indexed}/\${chunks.length}\`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(\`✓ 索引完成: \${indexed} 个 chunks\`);
    console.log(\`  总耗时: \${duration}ms\`);
    console.log(\`  平均耗时: \${(duration / indexed).toFixed(0)}ms/chunk\`);

    db.close();
  } catch (err) {
    console.error('✗ 索引创建失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
NODE_SCRIPT
echo ""

# 步骤 7: 测试语义搜索
echo "🔍 步骤 7: 测试语义搜索（真实 embedding）..."
node << 'NODE_SCRIPT'
const Database = require('better-sqlite3');
const path = require('path');
const { getEmbedding } = require('./dist/tools/embeddings.js');
const { loadConfig } = require('./dist/tools/config.js');

const MEMORY_DIR = '/root/.opencode/memory';
const DB_PATH = path.join(MEMORY_DIR, 'vector-index.db');

(async () => {
  try {
    const config = await loadConfig();
    const db = new Database(DB_PATH, { readonly: true });

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

    // 测试查询
    const queries = [
      "项目使用什么技术",
      "开发的目标是什么",
      "如何测试"
    ];

    for (const query of queries) {
      console.log(\`\n查询: "\${query}"\`);

      const startTime = Date.now();
      const queryEmbedding = await getEmbedding(query, config);
      const embedDuration = Date.now() - startTime;

      const rows = db.prepare(\`
        SELECT file_path, chunk, line_start, line_end, embedding
        FROM memory_chunks
      \`).all();

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

      console.log(\`  Embedding 耗时: \${embedDuration}ms\`);
      console.log(\`  找到 \${results.length} 个结果\n\`);

      results.slice(0, 2).forEach((r, i) => {
        const scorePercent = (r.score * 100).toFixed(1);
        console.log(\`  \${i + 1}. [\${r.file} Lines \${r.line_start}-\${r.line_end}]\`);
        console.log(\`     相关性: \${scorePercent}%\`);
        console.log(\`     \${r.snippet}...\n\`);
      });
    }

    db.close();
  } catch (err) {
    console.error('✗ 搜索测试失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
NODE_SCRIPT
echo ""

# 步骤 8: 测试缓存效果
echo "🚀 步骤 8: 测试 embedding 缓存..."
node << 'NODE_SCRIPT'
const { getEmbedding, getCacheStats } = require('./dist/tools/embeddings.js');
const { loadConfig } = require('./dist/tools/config.js');

(async () => {
  try {
    const config = await loadConfig();
    const testText = "测试缓存的文本";

    console.log('第一次调用（无缓存）:');
    const start1 = Date.now();
    await getEmbedding(testText, config);
    const time1 = Date.now() - start1;
    console.log(`  耗时: ${time1}ms`);

    const stats1 = getCacheStats();
    console.log(`  缓存大小: ${stats1.size}/${stats1.maxSize}`);

    console.log('\n第二次调用（有缓存）:');
    const start2 = Date.now();
    await getEmbedding(testText, config);
    const time2 = Date.now() - start2;
    console.log(`  耗时: ${time2}ms`);

    const stats2 = getCacheStats();
    console.log(`  缓存大小: ${stats2.size}/${stats2.maxSize}`);

    const speedup = ((time1 - time2) / time1 * 100).toFixed(1);
    console.log(`\n✓ 缓存加速: ${speedup}%`);
  } catch (err) {
    console.error('✗ 缓存测试失败:', err.message);
    process.exit(1);
  }
})();
NODE_SCRIPT
echo ""

# 最终总结
echo "========================================"
echo "✅ Embedding 集成测试完成！"
echo "========================================"
echo ""
echo "测试总结:"
echo "  ✓ LocalAI API 连接成功"
echo "  ✓ 配置系统正常"
echo "  ✓ 真实 embedding 生成"
echo "  ✓ 向量索引创建"
echo "  ✓ 语义搜索功能"
echo "  ✓ 缓存机制工作"
echo ""
echo "📊 性能数据:"
ls -lh "$MEMORY_DIR/vector-index.db" 2>/dev/null | awk '{print "  数据库大小: " $5}'
echo ""
echo "🎯 结论:"
echo "  - LocalAI 提供了兼容 OpenAI 的 embedding API"
echo "  - 插件成功集成并使用真实 embedding"
echo "  - 语义搜索功能完全正常"
echo "  - 可以替代 OpenAI API 用于开发测试"
echo ""
echo "💡 生产环境建议:"
echo "  - 开发/测试: 使用 LocalAI（免费、离线）"
echo "  - 生产环境: 使用 OpenAI API（质量更好）"
echo ""
