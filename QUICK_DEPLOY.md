# 🚀 快速部署指南

## 一键部署（推荐）

### 在服务器上执行：

```bash
# 1. 克隆或上传项目到服务器
cd /path/to/chat-bi

# 2. 配置环境变量
cp .env.example .env  # 如果有的话
nano .env             # 编辑配置

# 3. 安装 PM2（如果未安装）
npm install -g pm2

# 4. 运行部署脚本
./deploy.sh
```

搞定！应用会自动构建并在后台运行。

---

## 手动部署

如果你想一步步操作：

```bash
# 1. 安装依赖
npm install

# 2. 配置数据库
npx prisma generate
npx prisma migrate deploy

# 3. 构建项目
npm run build

# 4. 启动应用
pm2 start ecosystem.config.js

# 5. 保存 PM2 配置
pm2 save
```

---

## 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs chat-bi

# 重启应用
pm2 restart chat-bi

# 停止应用
pm2 stop chat-bi

# 删除应用
pm2 delete chat-bi
```

---

## 更新应用

```bash
# 直接运行部署脚本即可
./deploy.sh
```

---

## 环境变量配置

`.env` 文件内容：

```env
# 数据库连接
DATABASE_URL="mysql://root:password@localhost:3306/chat_db"

# WebSocket 地址
NEXT_PUBLIC_WEBSOCKET_URL="ws://your-server-ip:12224/ws"

# 模型 API 地址
MODEL_API_URL="http://your-server-ip:12224"
```

---

## 开机自启动

```bash
# 保存当前进程
pm2 save

# 生成启动脚本
pm2 startup

# 执行输出的命令（类似下面）
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username
```

---

## 访问应用

默认端口：`http://your-server-ip:3001`

如需修改端口，编辑 `ecosystem.config.js` 中的 `PORT` 配置。

---

## 需要帮助？

详细文档请查看：`DEPLOYMENT.md`

常见问题排查：
- 日志位置：`./logs/` 目录
- PM2 日志：`pm2 logs chat-bi --lines 100`
- 查看进程：`pm2 monit`

