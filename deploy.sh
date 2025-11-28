#!/bin/bash
set -e

echo "🚀 开始部署 Chat-BI 应用..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 如果使用 Git，拉取最新代码
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 拉取最新代码...${NC}"
    git pull
fi

# 安装依赖
echo -e "${YELLOW}📦 安装依赖...${NC}"
npm install

# 运行数据库迁移
echo -e "${YELLOW}🗄️ 运行数据库迁移...${NC}"
npx prisma generate
npx prisma migrate deploy

# 构建应用
echo -e "${YELLOW}🔨 构建生产版本...${NC}"
npm run build

# 创建日志目录
mkdir -p logs

# 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，请先运行: npm install -g pm2"
    exit 1
fi

# 检查应用是否已在运行
if pm2 describe chat-bi > /dev/null 2>&1; then
    echo -e "${YELLOW}♻️ 重启应用...${NC}"
    pm2 restart chat-bi
else
    echo -e "${YELLOW}🚀 启动应用...${NC}"
    pm2 start ecosystem.config.js
fi

# 保存 PM2 进程列表
pm2 save

echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "查看应用状态: pm2 status"
echo "查看日志: pm2 logs chat-bi"
echo "查看监控: pm2 monit"

