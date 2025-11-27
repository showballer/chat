# WebSocket 接口文档

## 概述
本WebSocket接口提供实时数据查询功能，支持流式SQL生成和实时状态反馈。

## 端点信息
- **rul**: `ws://172.31.24.111:12224/ws`
- **协议**: WebSocket
- **功能**: 处理数据查询请求，支持流式响应和实时状态更新
- **主要特性**:
  - 流式SQL生成
  - 实时状态更新
  - 错误自动重试机制
  - SQL重写功能

## 请求格式

### 连接建立
客户端通过WebSocket连接到 `/ws` 端点。

### 消息格式
发送JSON格式的消息：
```json
{
  "type": "query",
  "query": "查询语句"
}
```

**字段说明：**
- `type` (string): 消息类型，固定为 `"query"`
- `query` (string): 要执行的查询语句

## 响应流程详解

### 1. 查询处理开始
**类型**: 直接返回
**消息**: `"正在处理查询请求..."`

### 2. SQL生成准备
**类型**: 直接返回
**消息**: `"正在调用text2sql模型生成SQL语句..."`

### 3. SQL生成过程
**类型**: 🔄 **流式返回**

**示例流式输出**:
```
"SELECT"
"SELECT *"
"SELECT * FROM"
"SELECT * FROM users_table"
"SELECT * FROM users_table WHERE"
"SELECT * FROM users_table WHERE date >= '2024-01-01'"
```
### 4. SQL生成完成标志
**类型**: 直接返回
**消息**: `"DONE"`

### 5. SQL语句确定
**类型**: 直接返回
**消息**: `"最终SQL语句: {处理后的SQL语句}"`


### 6. SQL执行阶段

#### 6.1 首次执行
**类型**: 直接返回
**消息**: `"正在执行SQL查询..."`

#### 6.2 执行成功路径
**类型**: 直接返回
**消息**: `"SQL查询成功，结果行数: {实际行数}"`

#### 6.3 执行失败 - 重试流程
**类型**: 直接返回
**消息序列**:
1. `"SQL查询失败: {具体错误信息}"`
2. `"正在尝试重写SQL语句..."`
3. `"模型重写的SQL内容: {重写后的完整内容}"`
4. `"重写后的SQL语句: {提取出的SQL语句}"`

#### 6.4 重试执行
**类型**: 直接返回
**消息**: `"正在执行重写后的SQL查询..."`

#### 6.5 重试结果
**类型**: 直接返回
**成功消息**: `"重写后的SQL查询成功"`
**失败消息**: `"重写后的SQL查询仍然失败: {具体错误信息}"`

### 7. 错误处理

#### 7.1 SQL生成失败
**类型**: 直接返回
**消息**: `"SQL语句生成失败"`
**触发条件**: `sql_sentence` 为 `None`

#### 7.2 查询处理异常
**类型**: 直接返回
**消息**: `"查询处理过程中发生异常: {异常信息}"`
**触发条件**: 函数执行过程中发生未捕获的异常

## 函数内部返回值

### 成功返回
```python
{
    "status": "success",
    "sql": "最终执行的SQL语句",
    "result": [查询结果数据]
}
```

### 失败返回
```python
{
    "status": "error",
    "message": "错误描述信息"
}
```

## 完整消息时序图

```
客户端查询请求
    ↓
1. "正在处理查询请求..."                    [直接返回]
    ↓
2. "正在调用text2sql模型生成SQL语句..."       [直接返回]
    ↓
3. [🔄流式SQL生成 chunks...]                [流式返回]
   - "SELECT"
   - "SELECT * FROM"
   - "SELECT * FROM table_name"
   - ...
    ↓
4. "DONE"                                   [直接返回]
    ↓
5. "最终SQL语句: SELECT * FROM table_name..." [直接返回]
    ↓
6. "正在执行SQL查询..."                      [直接返回]
    ↓
   [成功分支]
7. "SQL查询成功，结果行数: 123"              [直接返回]
    ↓
   [返回函数结果: {"status": "success", ...}]

   [失败分支]
7. "SQL查询失败: Table 'table_name' doesn't exist" [直接返回]
    ↓
8. "正在尝试重写SQL语句..."                  [直接返回]
    ↓
9. "模型重写的SQL内容: SELECT * FROM correct_table..." [直接返回]
    ↓
10. "重写后的SQL语句: SELECT * FROM correct_table..." [直接返回]
    ↓
11. "正在执行重写后的SQL查询..."              [直接返回]
    ↓
12. [成功] "重写后的SQL查询成功"             [直接返回]
    [失败] "重写后的SQL查询仍然失败: Permission denied" [直接返回]
```

## 技术实现细节

### 流式处理实现
```python
async def query_insight_generator(chain, query: str, schema: str, ):
    async for chunk in chain.astream({
        "query": query, "schema": schema,
        }):
        yield chunk  # 逐个 token 输出
        await asyncio.sleep(0.01)  # 控制流速

full_content = []
async for chunk in query_insight_generator(text2sql_chain, query, schema,):
    chunk_msg = chunk.content
    await websocket.send_text(chunk_msg)  # 实时发送每个chunk
    full_content.append(chunk_msg)
```

### SQL处理流程
1. **提取**: `extract_sql(candidate_sql_sentence)`
2. **部门处理**: `abbr_process(extract_sql_sentence, distinct_dept_dict)`
3. **项目处理**: `abbr_process(sql_sentence_dept, distinct_project_dict)`

### 错误恢复机制
- 首次SQL执行失败时自动触发重写机制
- 使用 `sql_rewrite_chain` 进行SQL重写
- 提供第二次执行机会
- 重试失败后返回错误信息

### 结果处理
```python
result = mysql_db.run(sql_sentence, include_columns=True)
if isinstance(result, str):
    result_data = eval(result)
    row_count = len(result_data)
else:
    result_data = result
    row_count = len(result)
```

## 日志记录
所有WebSocket发送的消息都有对应的日志记录，格式为：
```
logger.info(f"WebSocket发送: {message}")
```

流式chunk的日志格式：
```
logger.info(f"WebSocket发送流式chunk: {chunk_msg}")
```

## 注意事项

1. **连接管理**: 客户端需要处理WebSocket连接断开的情况
2. **消息顺序**: 建议客户端按接收顺序处理消息以保持状态一致性
3. **错误处理**: 客户端应能够处理各种错误消息并给出相应的用户反馈
4. **流式数据**: 流式SQL生成期间可能产生大量小消息，客户端需要合理缓冲和处理
5. **字符编码**: 所有消息使用UTF-8编码，支持中文内容

## 相关依赖
- `text2sql_chain`: SQL生成链
- `sql_rewrite_chain`: SQL重写链
- `mysql_db`: MySQL数据库连接
- `distinct_dept_dict`: 部门缩写字典
- `distinct_project_dict`: 项目缩写字典
- `extract_sql`: SQL提取函数
- `abbr_process`: 缩写处理函数