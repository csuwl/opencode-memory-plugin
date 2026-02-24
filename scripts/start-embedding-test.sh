#!/bin/bash

# 快速启动脚本 - LocalAI Embedding 测试
# 使用更轻量的配置

set -e

echo "========================================"
echo "🐳 启动 Docker Embedding 测试环境"
echo "========================================"
echo ""

# 检查 Docker 是否运行
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Docker 未运行，请先启动 Docker Desktop"
  exit 1
fi

echo "✓ Docker 运行正常"
echo ""

# 停止并清理旧容器
echo "🧹 清理旧容器..."
docker-compose -f docker-compose.embedding-test.yml down -v 2>/dev/null || true
echo ""

# 拉取镜像
echo "📥 拉取 Docker 镜像..."
echo "  - localai/localai:latest"
echo "  - node:20 (用于 OpenCode 测试)"
echo ""
docker-compose -f docker-compose.embedding-test.yml pull
echo ""

# 启动服务
echo "🚀 启动服务..."
echo "  1. LocalAI (embedding 服务)"
echo "  2. OpenCode 测试容器"
echo ""
echo "⚠️  注意: LocalAI 首次启动需要下载模型，可能需要 2-5 分钟"
echo ""

docker-compose -f docker-compose.embedding-test.yml up --build

# 清理
echo ""
echo "🧹 清理容器..."
docker-compose -f docker-compose.embedding-test.yml down
