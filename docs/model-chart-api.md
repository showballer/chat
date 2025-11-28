# 模型侧图表生成接口文档

## 接口概述

该接口用于根据查询结果数据自动生成图表配置，包括图表类型选择、坐标轴配置、数据映射等。

---

## 接口信息

### 基本信息

- **接口名称**: 生成图表配置
- **请求路径**: `/generate-chart`
- **请求方式**: `POST`
- **Content-Type**: `application/json`

---

## 请求参数

### 请求 Body (JSON)

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| query_result | Array | 是 | SQL 查询结果数据（JSON 数组） | 见下方示例 |

### 请求示例

#### 示例 1: 多行数据（适合柱状图/面积图）

```json
{
  "query_result": [
    {"department": "工业数智业部", "count": 186},
    {"department": "智能云构事业部", "count": 305},
    {"department": "智能道路业部", "count": 237},
    {"department": "研发中心", "count": 73},
    {"department": "金融数智事业部", "count": 209}
  ]
}
```

#### 示例 2: 单行数据（适合数字卡片）

```json
{
  "query_result": [
    {"department_count": 14}
  ]
}
```

#### 示例 3: 单行多列数据（适合数字卡片网格）

```json
{
  "query_result": [
    {"total": 1000, "average": 75, "max": 95, "min": 30}
  ]
}
```

---

## 响应参数

### 响应 Body (JSON)

| 参数名 | 类型 | 说明 |
|--------|------|------|
| type | String | 图表类型：`area` / `bar` / `pie` / `radial` / `stat` |
| data | Array | 处理后的图表数据 |
| xKey | String | X 轴数据字段名（仅 area/bar 需要） |
| yKey | String | Y 轴数据字段名（仅 area/bar 需要） |
| nameKey | String | 名称字段（仅 pie/radial 需要） |
| valueKey | String | 数值字段（仅 pie/radial 需要） |
| xAxisLabel | String | X 轴显示标签（可选，用于控制轴标签显示） |
| yAxisLabel | String | Y 轴显示标签（可选） |
| supportedTypes | Array<String> | 支持切换的图表类型列表（可选） |

---

## 响应示例

### 示例 1: 柱状图/面积图响应

```json
{
  "type": "bar",
  "data": [
    {"department": "工业数智业部", "count": 186},
    {"department": "智能云构事业部", "count": 305},
    {"department": "智能道路业部", "count": 237},
    {"department": "研发中心", "count": 73},
    {"department": "金融数智事业部", "count": 209}
  ],
  "xKey": "department",
  "yKey": "count",
  "xAxisLabel": "部门",
  "yAxisLabel": "人数",
  "supportedTypes": ["bar", "area"]
}
```

### 示例 2: 饼图/径向图响应

```json
{
  "type": "pie",
  "data": [
    {"browser": "Chrome", "visitors": 275},
    {"browser": "Safari", "visitors": 200},
    {"browser": "Firefox", "visitors": 187},
    {"browser": "Edge", "visitors": 173},
    {"browser": "Other", "visitors": 90}
  ],
  "nameKey": "browser",
  "valueKey": "visitors",
  "supportedTypes": ["pie", "radial"]
}
```

### 示例 3: 数字卡片响应

```json
{
  "type": "stat",
  "data": [
    {"department_count": 14}
  ]
}
```

### 示例 4: 数字卡片网格响应

```json
{
  "type": "stat",
  "data": [
    {"total": 1000, "average": 75, "max": 95, "min": 30}
  ]
}
```

---

## 图表类型判断逻辑（模型侧需要实现）

### 1. 数字卡片 (stat)
- **判断条件**: 数据只有 1 行
- **适用场景**:
  - 聚合统计结果（COUNT、SUM、AVG 等）
  - 单个 KPI 指标
  - 多个 KPI 指标（多列）

### 2. 饼图/径向图 (pie/radial)
- **判断条件**:
  - 数据有多行（≥2行）
  - 有 2 列数据
  - 第一列是分类/名称（文本）
  - 第二列是数值（数字）
- **适用场景**:
  - 占比分析
  - 分类统计

### 3. 柱状图/面积图 (bar/area)
- **判断条件**:
  - 数据有多行（≥2行）
  - 有 2 列或更多列
  - 至少有一列是数值型
- **适用场景**:
  - 趋势分析
  - 对比分析
  - 时间序列数据

---

## 数据处理要求

### 1. 数据量限制
- **饼图/径向图**: 建议最多展示 5-8 项数据，超过部分可合并为 "其他"
- **柱状图/面积图**: 建议最多展示 20 个数据点，避免 X 轴过密

### 2. X轴/Y轴标签处理
- 模型侧需要智能判断字段含义，生成友好的轴标签
- 例如：
  - `department` → "部门"
  - `count` → "数量"
  - `created_at` → "日期"
  - `total_amount` → "总金额"

### 3. 日期格式处理
- 如果 X 轴是日期字段，建议格式化为：
  - `YYYY-MM-DD` 或 `MM-DD`
  - 太长可以只显示前 10 个字符

---

## 错误响应

### 错误格式

```json
{
  "error": "错误信息描述",
  "code": "ERROR_CODE"
}
```

### 常见错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|------------|
| INVALID_DATA | 输入数据格式错误 | 400 |
| EMPTY_DATA | 查询结果为空 | 400 |
| UNSUPPORTED_DATA | 数据结构不支持任何图表类型 | 400 |
| MODEL_ERROR | 模型内部错误 | 500 |

### 错误示例

```json
{
  "error": "查询结果为空，无法生成图表",
  "code": "EMPTY_DATA"
}
```

---

## 测试用例

### 测试用例 1: 部门人数统计

**请求**:
```bash
curl -X POST http://model-api-url/generate-chart \
  -H "Content-Type: application/json" \
  -d '{
    "query_result": [
      {"department": "工业数智业部", "employee_count": 186},
      {"department": "智能云构事业部", "employee_count": 305},
      {"department": "智能道路业部", "employee_count": 237}
    ]
  }'
```

**期望响应**:
```json
{
  "type": "bar",
  "data": [
    {"department": "工业数智业部", "employee_count": 186},
    {"department": "智能云构事业部", "employee_count": 305},
    {"department": "智能道路业部", "employee_count": 237}
  ],
  "xKey": "department",
  "yKey": "employee_count",
  "xAxisLabel": "部门",
  "yAxisLabel": "员工数量",
  "supportedTypes": ["bar", "area"]
}
```

### 测试用例 2: 总部门数统计

**请求**:
```bash
curl -X POST http://model-api-url/generate-chart \
  -H "Content-Type: application/json" \
  -d '{
    "query_result": [
      {"department_count": 14}
    ]
  }'
```

**期望响应**:
```json
{
  "type": "stat",
  "data": [
    {"department_count": 14}
  ]
}
```

---

## 环境变量配置（后端）

在 `.env` 文件中配置模型 API 地址：

```env
MODEL_API_URL=http://your-model-api-host:port
```

---

## 前后端联调流程

1. **前端**: 用户点击"生成图表"按钮
2. **前端**: 调用后端接口 `POST /api/messages/{messageId}/generate-chart`
3. **后端**: 获取 message 的 queryResult
4. **后端**: 调用模型侧接口 `POST /generate-chart`
5. **模型侧**: 分析数据，返回图表配置
6. **后端**: 保存图表配置到 message.chartData
7. **后端**: 返回图表配置给前端
8. **前端**: 根据配置渲染对应图表

---

## 注意事项

1. **性能优化**: 建议模型侧对图表生成接口做缓存，相同数据可直接返回缓存结果
2. **数据安全**: 不要在日志中输出完整的查询结果数据
3. **超时处理**: 建议设置接口超时时间为 10 秒
4. **幂等性**: 同一个 messageId 多次调用应返回相同结果

---

## 版本历史

- **v1.0** (2024-11-28): 初始版本
