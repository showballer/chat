# Test Verification for SQL Extraction Fix

## Test Case: "8月份部门工时"

### Expected Backend Response Pattern:
```
1. "正在处理查询请求..."
2. "正在调用text2sql模型生成SQL语句..."
3. Streaming chunks: "根据您的要求，以下是查询2025年8月份各部门工时的SQL语句："
4. Streaming chunks: "```sql\nSELECT...\n```"
5. JSON result: {"status":"success","sql":"SELECT...","result":[...]}
```

### Expected UI Behavior:

#### AI Answer Panel:
- Should display: "根据您的要求，以下是查询2025年8月份各部门工时的SQL语句："
- Should NOT include ```sql blocks

#### SQL Panel (Collapsible):
- Should display extracted SQL or result.sql
- Should show CheckCircle2 icon when completed
- Should be collapsible with ChevronUp/ChevronDown

#### Query Results Panel:
- Should display QueryResultTable with 10 department records
- Columns: 部门, 工时总计, 填报次数

### Code Flow:

1. **Streaming Phase:**
   ```typescript
   aiAnswerRef.current += message; // Accumulates all chunks including ```sql blocks
   ```

2. **JSON Result Handler:**
   ```typescript
   if (aiAnswerRef.current) {
     const sqlBlockMatch = aiAnswerRef.current.match(/```sql\n?([\s\S]*?)\n?```/);
     if (sqlBlockMatch) {
       const extractedSql = sqlBlockMatch[1].trim(); // Extract SQL
       sqlCodeBlockRef.current = extractedSql;
       aiAnswerRef.current = aiAnswerRef.current.replace(/```sql\n?[\s\S]*?\n?```/, '').trim(); // Remove from answer
     }
   }
   ```

3. **Save to Database & Update UI:**
   ```typescript
   {
     status: "completed",
     content: aiAnswerRef.current, // AI answer without SQL blocks
     queryResult: result.result, // Table data
     sqlQuery: result.sql || sqlCodeBlockRef.current || null // Priority order
   }
   ```

## Console Logs to Monitor:

```
Testing WebSocket server availability...
✅ WebSocket server is available
Creating new WebSocket connection...
✅ WebSocket connected
📤 Query sent: 8月份部门工时
📨 WS Message: 正在处理查询请求...
🤔 Thinking: 正在处理查询请求...
📨 WS Message: 正在调用text2sql模型生成SQL语句...
📨 WS Message: [AI streaming chunks]
💬 AI chunk: 根据您的要求...
📨 WS Message: {"status":"success","sql":"SELECT...","result":[...]}
📊 Query Result: {status: 'success', sql: '...', result: [...]}
📝 Extracted SQL from answer before result: SELECT `DEPT` AS `部门`...
WebSocket disconnected
```

## Verification Checklist:

- [ ] AI answer displays without ```sql blocks
- [ ] SQL panel shows correct SQL statement
- [ ] SQL panel has CheckCircle2 icon
- [ ] SQL panel is collapsible
- [ ] Query results table displays 10 rows
- [ ] All updates happen in real-time (no refresh needed)
- [ ] Console shows "Extracted SQL from answer before result" log
- [ ] Database PATCH request completes successfully

## Next Steps:

Open http://localhost:3002 and test with query "8月份部门工时"
