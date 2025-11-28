# 服务器部署指南

## 📋 前置要求

在服务器上需要安装：
- Node.js (v18 或更高版本)
- npm 或 yarn
- MySQL 数据库
- PM2 (全局安装)

## 🚀 部署步骤

### 1. 安装 PM2（如果未安装）

```bash
npm install -g pm2
```

### 2. 上传项目到服务器

将整个项目文件夹上传到服务器，例如：
```bash
scp -r /path/to/chat user@server:/home/user/chat-bi
# 或使用 Git
git clone <your-repo-url>
```

### 3. 在服务器上配置环境变量

创建 `.env` 文件：
```bash
cd /path/to/chat-bi
nano .env
```

添加以下内容（根据实际情况修改）：
```env
DATABASE_URL="mysql://root:your-password@localhost:3306/chat_db"
NEXT_PUBLIC_WEBSOCKET_URL="ws://your-server-ip:12224/ws"
MODEL_API_URL="http://your-server-ip:12224"
```

### 4. 安装依赖

```bash
npm install --production=false
# 或
npm install
```

### 5. 执行数据库迁移

```bash
npx prisma generate
npx prisma migrate deploy
```

如果是新数据库，确保数据库已创建：
```sql
CREATE DATABASE IF NOT EXISTS chat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. 构建生产版本

```bash
npm run build
```

这会生成优化后的生产构建文件到 `.next` 目录。

### 7. 创建日志目录

```bash
mkdir -p logs
```

### 8. 使用 PM2 启动应用

```bash
# 使用 PM2 配置文件启动
pm2 start ecosystem.config.js

# 或者直接启动（不使用配置文件）
pm2 start npm --name "chat-bi" -- start
```

### 9. 查看应用状态

```bash
# 查看所有应用
pm2 list

# 查看应用详情
pm2 show chat-bi

# 查看日志
pm2 logs chat-bi

# 实时日志
pm2 logs chat-bi --lines 100
```

## 🔧 PM2 常用命令

### 应用管理
```bash
# 启动应用
pm2 start ecosystem.config.js

# 停止应用
pm2 stop chat-bi

# 重启应用
pm2 restart chat-bi

# 删除应用
pm2 delete chat-bi

# 重载应用（0秒停机）
pm2 reload chat-bi
```

### 监控和日志
```bash
# 查看监控面板
pm2 monit

# 查看日志
pm2 logs chat-bi

# 清空日志
pm2 flush

# 查看特定错误日志
pm2 logs chat-bi --err
```

### 开机自启动
```bash
# 保存当前 PM2 进程列表
pm2 save

# 生成开机启动脚本
pm2 startup

# 执行上一步输出的命令（类似）
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username
```

### 更新应用
```bash
# 方式1: 拉取代码并重启
cd /path/to/chat-bi
git pull
npm install
npm run build
pm2 restart chat-bi

# 方式2: 使用 PM2 重载（推荐，0秒停机）
cd /path/to/chat-bi
git pull
npm install
npm run build
pm2 reload chat-bi
```

## 📊 监控配置

### PM2 Plus (可选的云监控)
```bash
# 注册并连接到 PM2 Plus
pm2 link <secret_key> <public_key>

# 取消连接
pm2 unlink
```

### 查看资源使用
```bash
pm2 monit
```

## 🔍 故障排查

### 应用无法启动
```bash
# 查看详细日志
pm2 logs chat-bi --lines 200

# 查看错误日志
pm2 logs chat-bi --err

# 检查进程状态
pm2 describe chat-bi
```

### 端口被占用
```bash
# 修改 ecosystem.config.js 中的 PORT
# 或在 .env 中设置
PORT=3002

# 重启应用
pm2 restart chat-bi
```

### 数据库连接失败
```bash
# 检查数据库连接
mysql -u root -p -h localhost -P 3306

# 验证 .env 文件中的 DATABASE_URL
cat .env | grep DATABASE_URL

# 重新运行迁移
npx prisma migrate deploy
```

### 内存溢出
```bash
# 修改 ecosystem.config.js 中的 max_memory_restart
max_memory_restart: '2G'

# 重启应用
pm2 restart chat-bi
```

## 🌐 Nginx 反向代理（可选）

如果想使用域名访问，可以配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:12224;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

重启 Nginx：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 📝 快速部署脚本

创建 `deploy.sh`：
```bash
#!/bin/bash
set -e

echo "🚀 开始部署..."

# 拉取最新代码
git pull

# 安装依赖
echo "📦 安装依赖..."
npm install

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
npx prisma generate
npx prisma migrate deploy

# 构建应用
echo "🔨 构建应用..."
npm run build

# 重启 PM2
echo "♻️ 重启应用..."
pm2 restart chat-bi

echo "✅ 部署完成！"
pm2 status
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔐 安全建议

1. **环境变量**：确保 `.env` 文件权限正确
   ```bash
   chmod 600 .env
   ```

2. **防火墙**：只开放必要的端口
   ```bash
   sudo ufw allow 3001/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **使用 HTTPS**：配置 SSL 证书（Let's Encrypt）
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

4. **限制数据库访问**：只允许本地连接
   ```sql
   CREATE USER 'chatbi'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON chat_db.* TO 'chatbi'@'localhost';
   FLUSH PRIVILEGES;
   ```

## 📈 性能优化

1. **启用多实例**（根据 CPU 核心数）
   ```js
   // ecosystem.config.js
   instances: 'max', // 或具体数字如 2, 4
   exec_mode: 'cluster',
   ```

2. **配置缓存**：在 Nginx 中启用静态资源缓存

3. **数据库优化**：添加适当的索引

4. **日志轮转**：配置日志自动清理
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

## 📞 支持

如有问题，检查：
- PM2 日志：`pm2 logs chat-bi`
- 系统日志：`journalctl -u pm2-username -f`
- 应用日志：`./logs/` 目录下的文件

祝部署顺利！🎉

