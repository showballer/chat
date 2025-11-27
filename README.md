# ChatBI - 智能数据库查询系统

基于自然语言的数据库查询系统，使用 Next.js + React + shadcn/ui 构建。用户可以通过自然语言输入查询需求，系统实时展示 SQL 生成过程和查询结果。

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 库**: React 19 + shadcn/ui
- **样式**: Tailwind CSS
- **数据库**: MySQL + Prisma ORM
- **实时通信**: WebSocket
- **主题**: 支持亮色/暗色模式切换

## 功能特性

- 📝 自然语言查询转 SQL
- 💬 多会话管理
- 🔄 实时流式展示 SQL 生成过程
- 📊 查询结果表格展示
- 💾 会话历史记录
- 🌓 暗色模式支持
- 📱 响应式设计

## 项目结构

```
chat/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── conversations/    # 会话管理 API
│   │   └── messages/         # 消息管理 API
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面
├── components/               # React 组件
│   ├── chat/                 # 聊天相关组件
│   │   ├── chat-input.tsx    # 输入框
│   │   ├── message-item.tsx  # 消息项
│   │   ├── message-list.tsx  # 消息列表
│   │   ├── query-result-table.tsx  # 结果表格
│   │   └── sidebar.tsx       # 侧边栏
│   ├── ui/                   # shadcn/ui 组件
│   └── theme-provider.tsx    # 主题提供者
├── hooks/                    # React Hooks
│   ├── use-toast.ts          # Toast 通知
│   └── use-websocket.ts      # WebSocket 连接
├── lib/                      # 工具函数
│   ├── prisma.ts             # Prisma 客户端
│   └── utils.ts              # 工具函数
├── prisma/                   # Prisma 配置
│   └── schema.prisma         # 数据库 Schema
└── .env                      # 环境变量
```

## 数据库设计

### conversations 表
- `id`: 会话 ID (UUID)
- `title`: 会话标题
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### messages 表
- `id`: 消息 ID (UUID)
- `conversationId`: 所属会话 ID
- `role`: 角色 (user/assistant)
- `content`: 消息内容
- `sqlQuery`: 生成的 SQL 语句
- `queryResult`: 查询结果 (JSON)
- `status`: 状态 (processing/completed/error)
- `errorMessage`: 错误信息
- `createdAt`: 创建时间

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="mysql://root:Ideal123%40mysql@localhost:3306/chat_db"
NEXT_PUBLIC_WEBSOCKET_URL="ws://172.31.24.111:12224/ws"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库 Schema
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## WebSocket 接口说明

### 连接地址
```
ws://172.31.24.111:12224/ws
```

### 请求格式
```json
{
  "type": "query",
  "query": "查询语句"
}
```

### 响应流程

1. **查询处理开始**: `"正在处理查询请求..."`
2. **SQL生成准备**: `"正在调用text2sql模型生成SQL语句..."`
3. **SQL生成过程**: 流式返回 SQL 片段
4. **SQL生成完成**: `"DONE"`
5. **最终SQL语句**: `"最终SQL语句: SELECT ..."`
6. **执行查询**: `"正在执行SQL查询..."`
7. **查询结果**: `"SQL查询成功，结果行数: 123"`

## API 接口

### 会话管理

- `GET /api/conversations` - 获取所有会话
- `POST /api/conversations` - 创建新会话
- `GET /api/conversations/[id]` - 获取会话详情
- `PATCH /api/conversations/[id]` - 更新会话
- `DELETE /api/conversations/[id]` - 删除会话

### 消息管理

- `POST /api/messages` - 创建消息
- `PATCH /api/messages/[id]` - 更新消息

## 使用说明

1. **创建新对话**: 点击左侧边栏的"新建对话"按钮
2. **输入查询**: 在底部输入框中输入自然语言查询
3. **查看结果**: 系统实时展示 SQL 生成过程和查询结果
4. **历史记录**: 左侧边栏显示所有历史对话
5. **切换对话**: 点击历史对话可切换到该对话
6. **删除对话**: 悬停在对话上显示删除按钮

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# Prisma 相关
npx prisma studio       # 打开数据库管理界面
npx prisma generate     # 生成 Prisma 客户端
npx prisma db push      # 推送 Schema 到数据库
```

## 主要依赖

- `next`: ^15.0.3
- `react`: 19.0.0-rc
- `@prisma/client`: ^5.22.0
- `@radix-ui/*`: shadcn/ui 组件基础
- `tailwindcss`: ^3.4.15
- `lucide-react`: ^0.462.0 (图标库)
- `next-themes`: ^0.4.4 (主题管理)

## 注意事项

1. 确保 MySQL 数据库正在运行并且可以连接
2. 确保 WebSocket 服务器正在运行 (ws://172.31.24.111:12224/ws)
3. Node.js 版本要求: >= 20.9.0
4. 首次运行需要执行 `npx prisma db push` 创建数据库表

## License

MIT
