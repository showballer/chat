# 快速开始指南

## 项目已完成构建

✅ 所有任务已完成：
1. Next.js 项目初始化完成
2. 数据库表结构已创建（conversations, messages）
3. Prisma ORM 已配置
4. 后端 API 路由已创建
5. WebSocket 客户端连接逻辑已实现
6. 主聊天界面布局已构建
7. 消息流式展示组件已实现
8. SQL 查询结果表格展示已实现
9. 会话历史管理功能已实现
10. 响应式设计和暗色模式支持已添加

## 当前状态

🟢 开发服务器已启动
- 访问地址: http://localhost:3001
- WebSocket 连接: ws://172.31.24.111:12224/ws
- 数据库: localhost:3306/chat_db

## 项目特性

### 🎨 UI/UX
- 类似 ChatGPT 的对话界面
- 左侧会话历史管理
- 实时流式 SQL 生成展示
- 查询结果表格展示
- 暗色/亮色模式切换
- 响应式设计

### 💻 技术实现
- **前端**: Next.js 15 + React 19 + shadcn/ui
- **数据库**: MySQL + Prisma ORM
- **实时通信**: WebSocket
- **样式**: Tailwind CSS

### 📊 功能模块

#### 1. 会话管理
- 创建新会话
- 查看历史会话
- 删除会话
- 自动保存对话历史

#### 2. 消息处理
- 发送自然语言查询
- 实时接收 WebSocket 消息
- 流式展示 SQL 生成过程
- 展示查询结果
- 错误处理和提示

#### 3. 数据展示
- SQL 代码高亮显示
- 表格形式展示查询结果
- 支持大数据集（显示前100条）
- 处理状态显示

## 使用流程

1. **打开浏览器访问**: http://localhost:3001

2. **开始对话**:
   - 页面会自动创建新会话
   - 或点击左侧"新建对话"按钮

3. **输入查询**:
   - 在底部输入框输入自然语言查询
   - 例如: "查询最近一周的销售数据"

4. **查看结果**:
   - 系统实时显示 SQL 生成过程
   - 展示生成的 SQL 语句
   - 显示查询结果表格

5. **管理会话**:
   - 左侧查看所有历史对话
   - 点击切换不同会话
   - 悬停显示删除按钮

## API 端点

### 会话 API
```
GET    /api/conversations       # 获取所有会话
POST   /api/conversations       # 创建新会话
GET    /api/conversations/:id   # 获取会话详情
PATCH  /api/conversations/:id   # 更新会话
DELETE /api/conversations/:id   # 删除会话
```

### 消息 API
```
POST   /api/messages            # 创建消息
PATCH  /api/messages/:id        # 更新消息
```

## WebSocket 消息流程

1. 客户端发送:
```json
{
  "type": "query",
  "query": "查询语句"
}
```

2. 服务器响应流程:
- `"正在处理查询请求..."`
- `"正在调用text2sql模型生成SQL语句..."`
- 流式返回 SQL 片段
- `"DONE"`
- `"最终SQL语句: SELECT ..."`
- `"正在执行SQL查询..."`
- `"SQL查询成功，结果行数: N"`

## 数据库结构

### conversations 表
```sql
CREATE TABLE conversations (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) DEFAULT '新对话',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### messages 表
```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  conversationId VARCHAR(36),
  role VARCHAR(20),
  content TEXT,
  sqlQuery TEXT,
  queryResult JSON,
  status VARCHAR(20),
  errorMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);
```

## 开发命令

```bash
# 启动开发服务器（已启动）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 数据库管理
npx prisma studio
```

## 故障排查

### WebSocket 连接失败
- 检查 WebSocket 服务器是否运行: ws://172.31.24.111:12224/ws
- 查看浏览器控制台错误信息
- 确认网络连接正常

### 数据库连接失败
- 检查 MySQL 是否运行
- 验证数据库连接字符串: mysql://root:Ideal123@mysql@localhost:3306/chat_db
- 确认数据库 `chat_db` 已创建

### 页面无法访问
- 确认开发服务器正在运行
- 检查端口 3001 是否被占用
- 查看终端错误日志

## 下一步

项目已完全可用！您可以：

1. ✅ 开始使用系统进行查询测试
2. ✅ 自定义 UI 样式和主题
3. ✅ 添加用户认证功能
4. ✅ 优化 WebSocket 重连逻辑
5. ✅ 添加数据导出功能
6. ✅ 实现查询历史搜索
7. ✅ 添加图表可视化功能

## 技术支持

如有问题，请检查：
- README.md - 完整文档
- 浏览器开发者工具控制台
- Next.js 终端输出
- 数据库日志

祝使用愉快！🎉
