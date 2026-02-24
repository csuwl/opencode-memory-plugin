#!/bin/bash

# 快速启动脚本 - 使用轻量级 sentence-transformers
# 这个版本更快，更适合开发测试

set -e

echo "========================================"
echo "🐳 快速启动 Embedding 测试环境"
echo "========================================"
echo ""
echo "使用: sentence-transformers (all-MiniLM-L6-v2)"
echo "优势: 启动快、体积小、质量好"
echo ""

# 检查 Docker
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Docker 未运行"
  exit 1
fi

# 清理旧容器
echo "🧹 清理旧容器..."
docker-compose -f docker-compose.quick-test.yml down -v 2>/dev/null || true
echo ""

# 启动服务
echo "🚀 启动服务（首次需要下载模型，约 1-2 分钟）..."
echo ""

docker-compose -f docker-compose.quick-test.yml up --build --abort-on-container-exit

# 测试完成后自动清理
echo ""
echo "✅ 测试完成，清理容器..."
docker-compose -f docker-compose.quick-test.yml down
echo ""
echo "💡 提示: 查看上方输出中的测试结果"
