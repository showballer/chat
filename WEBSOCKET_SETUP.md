# WebSocket 连接配置说明

## 🎯 新的连接策略

WebSocket 现在采用**按需连接**策略，不再保持长连接：

1. **页面加载时**: 测试一次服务器可用性（3秒超时）
2. **发送查询时**: 创建新的 WebSocket 连接
3. **查询完成后**: 自动关闭连接
4. **不会无限重连**: 只在需要时才连接

## ✅ 优化后的行为

### 页面加载
- 自动测试 WebSocket 服务器是否可用
- 测试连接会在 3 秒后超时
- **只测试一次，不会重复尝试**
- 测试完成后立即关闭连接

### 发送查询
- 点击发送时创建新连接
- 连接成功后发送查询
- 接收流式响应
- 完成后自动关闭连接

### 连接状态显示
- 🟢 **绿色**: 服务器可用
- 🔴 **红色**: 服务器不可用

## 📝 控制台日志

```
✅ 服务器可用时：
Testing WebSocket server availability...
✅ WebSocket server is available

❌ 服务器不可用时：
Testing WebSocket server availability...
❌ WebSocket server is not available

📤 发送查询时：
Creating new WebSocket connection...
✅ WebSocket connected
📤 Query sent: 你的查询内容
📨 WebSocket message: [服务器响应]
WebSocket disconnected
```

## 🔧 配置方法

修改 `.env` 文件：

```env
NEXT_PUBLIC_WEBSOCKET_URL="ws://你的服务器地址:端口/ws"
```

## 🎉 优势

1. ✅ **不会无限重连**
2. ✅ **减少服务器负担**
3. ✅ **更清晰的日志**
4. ✅ **更友好的提示**
