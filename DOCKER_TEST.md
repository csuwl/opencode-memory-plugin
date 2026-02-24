# Docker Embedding 测试指南

本目录包含完整的 Docker 测试环境，用于测试 OpenCode Memory Plugin 的真实 embedding 功能。

## 🎯 测试目标

验证插件在使用**真实 OpenAI 兼容的 embedding API** 时的功能：
- ✅ 真实 embedding 生成（不是 hash-based）
- ✅ 向量索引创建
- ✅ 语义搜索
- ✅ API 集成
- ✅ 缓存机制

## 🚀 快速开始

### 方案一：轻量级测试（推荐）⚡

使用 `sentence-transformers` 的轻量级 embedding 服务器：

```bash
# 一键启动
bash scripts/start-quick-test.sh
```

**特点：**
- ⚡ 启动快（1-2 分钟）
- 💾 体积小（~500MB）
- 🎯 质量好（384 维，适合语义搜索）
- 💰 完全免费

### 方案二：LocalAI 完整测试

使用 LocalAI 的完整 LLM 推理引擎：

```bash
# 一键启动
bash scripts/start-embedding-test.sh
```

**特点：**
- 🐘 功能完整（支持多种模型）
- 🔧 生产级
- ⚠️ 启动慢（3-5 分钟）
- 💾 体积大（~2GB+）

## 📋 测试内容

测试脚本 (`test-embedding-integration.sh`) 会执行：

1. **API 连接测试** - 验证 embedding 服务可用
2. **配置加载** - 测试配置文件系统
3. **Embedding 生成** - 测试真实 embedding 生成
4. **向量索引** - 创建带有真实 embedding 的索引
5. **语义搜索** - 测试语义相似度搜索
6. **缓存效果** - 验证缓存加速效果

## 🏗️ 架构

```
┌─────────────────────────────────────────┐
│  Docker Compose Network                 │
│                                         │
│  ┌──────────────────┐  ┌──────────────┐ │
│  │ Embedding API    │  │ OpenCode     │ │
│  │ (Port 8080)      │  │ Test         │ │
│  │                  │  │              │ │
│  │ - sentence-      │  │ - Plugin     │ │
│  │   transformers   │  │ - Config     │ │
│  │ - all-MiniLM-L6  │  │ - Test       │ │
│  │ - 384 dimensions │  │ - Scripts    │ │
│  └──────────────────┘  └──────────────┘ │
│         ▲                      │         │
│         │                      │         │
└─────────┼──────────────────────┼─────────┘
          │                      │
          │ HTTP API             │
          │ (OpenAI compatible)   │
          └──────────────────────┘
```

## 📊 预期输出

```
========================================
🧪 OpenCode Memory Plugin - Embedding 集成测试
========================================

✓ LocalAI 服务已就绪

📡 步骤 1: 测试 LocalAI Embedding API...
测试文本: This is a test sentence...
✓ LocalAI API 工作正常
  Embedding 维度: 384
  前 5 个值: [0.1234, -0.5678, ...]

⚙️  步骤 2: 创建配置文件...
✓ 配置文件创建完成

🧪 步骤 3: 测试配置加载...
✓ 配置加载成功
  Provider: openai
  Model: all-MiniLM-L6-v2
  Base URL: http://embedding-api:8080/v1

🧮 步骤 4: 测试真实 embedding 生成...
✓ Embedding 生成成功
  维度: 384
  耗时: 150ms

💾 步骤 5: 创建向量索引...
✓ 数据库表创建成功
✓ 文本分块: 3 个 chunks
✓ 索引完成: 3 个 chunks
  总耗时: 450ms
  平均耗时: 150ms/chunk

🔍 步骤 6: 测试语义搜索...
查询: "项目使用什么技术"
  找到 3 个结果
  1. [MEMORY.md Lines 10-12]
     相关性: 85.3%
     TypeScript 和 Node.js...

查询: "开发的目标是什么"
  找到 3 个结果
  1. [MEMORY.md Lines 15-18]
     相关性: 82.7%
     为 OpenCode 添加持久化...

🚀 步骤 7: 测试 embedding 缓存...
第一次调用（无缓存）:
  耗时: 150ms
第二次调用（有缓存）:
  耗时: 2ms
✓ 缓存加速: 98.7%

========================================
✅ Embedding 集成测试完成！
========================================

测试总结:
  ✓ LocalAI API 连接成功
  ✓ 配置系统正常
  ✓ 真实 embedding 生成
  ✓ 向量索引创建
  ✓ 语义搜索功能
  ✓ 缓存机制工作
```

## 🛠️ 手动测试

如果你想单独测试某个组件：

### 测试 Embedding API

```bash
# 启动 embedding 服务
docker-compose -f docker-compose.quick-test.yml up embedding-api

# 等待服务就绪后，测试 API
curl -X POST http://localhost:8080/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test" \
  -d '{
    "input": "测试文本",
    "model": "all-MiniLM-L6-v2"
  }' | jq '.'
```

### 进入 OpenCode 容器

```bash
# 启动测试容器
docker-compose -f docker-compose.quick-test.yml up opencode-test

# 在另一个终端进入容器
docker exec -it opencode-embedding-test bash

# 在容器内手动测试
cd /app
node --eval "
const { getEmbedding } = require('./dist/tools/embeddings.js');
const { loadConfig } = require('./dist/tools/config.js');

(async () => {
  const config = await loadConfig();
  const emb = await getEmbedding('测试', config);
  console.log('维度:', emb.length);
})();
"
```

## 🔧 故障排除

### 问题 1: Docker 启动慢

**原因**: 首次需要下载 embedding 模型（~120MB）

**解决**: 耐心等待 1-2 分钟，或使用更快的网络

### 问题 2: 端口冲突

**错误**: `Bind for 0.0.0.0:8080 failed`

**解决**:
```bash
# 检查端口占用
lsof -i :8080

# 或修改 docker-compose.yml 中的端口映射
ports:
  - "8081:8080"  # 改用 8081
```

### 问题 3: 内存不足

**错误**: Container killed (OOM)

**解决**:
```bash
# 增加 Docker 内存限制（Docker Desktop -> Settings -> Resources）
# 或关闭其他容器
docker system prune -a
```

### 问题 4: 测试失败

**检查**:
1. Embedding 服务是否就绪：`curl http://localhost:8080/health`
2. OpenCode 容器日志：`docker logs opencode-embedding-test`
3. 网络连接：`docker network inspect embedding-test-net`

## 📈 性能参考

使用 sentence-transformers (all-MiniLM-L6-v2)：

| 指标 | 数值 |
|------|------|
| Embedding 维度 | 384 |
| 单次请求耗时 | 100-200ms |
| 索引 10 chunks | 1-2s |
| 缓存加速 | 98%+ |
| 内存占用 | ~500MB |

## 🎓 与 OpenAI 对比

| 特性 | sentence-transformers | OpenAI API |
|------|----------------------|------------|
| 维度 | 384 | 1536 |
| 质量 | 良好 | 最佳 |
| 速度 | 快（本地） | 慢（网络） |
| 成本 | 免费 | ~$0.02/1000条 |
| 离线 | ✅ | ❌ |
| 部署 | 自托管 | 云端 |

## 📚 相关文档

- [CONFIG.md](CONFIG.md) - 配置指南
- [INSTALL.md](INSTALL.md) - 安装指南
- [README.md](README.md) - 项目介绍

## 🤝 贡献

如果发现问题或有改进建议，请：
1. 提交 Issue
2. 创建 PR
3. 联系维护者

---

**Happy Testing!** 🎉
