"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, ChevronDown, ChevronUp, CheckCircle2, BarChart3 } from "lucide-react";
import { QueryResultTable } from "./query-result-table";
import { ChartContainer, ChartConfig } from "@/components/charts/chart-container";
import ReactMarkdown from "react-markdown";

// 处理流式 Markdown 可能缺少换行/闭合的代码块，避免渲染残缺
const stripInlineBackticks = (content: string) => {
  // 移除单个反引号，避免非代码内容被包成行内代码；保留 ``` fenced code
  return content.replace(/(?<!`)`(?!`)/g, "");
};

const normalizeMarkdown = (content: string) => {
  if (!content) return content;
  let fixed = stripInlineBackticks(content);

  // 移除代码块语言标识，避免首行出现 "sql"
  fixed = fixed.replace(/```sql/gi, "```");

  // 确保 ```sql / ``` 后有换行，避免粘连
  fixed = fixed.replace(/```\s*([^\n])/gi, "```\n$1");
  fixed = fixed.replace(/```(?!\n)/g, "```\n");

  const fences = [...fixed.matchAll(/```/g)].map((m) => m.index ?? 0);

  // 如果只有开头没有结尾（奇数个），尝试在第一个空行前补闭合；否则追加在末尾
  if (fences.length % 2 === 1 && fences.length > 0) {
    const firstFenceIndex = fences[0];
    const afterFence = fixed.slice(firstFenceIndex + 3);
    const doubleNewline = afterFence.indexOf("\n\n");
    if (doubleNewline !== -1) {
      const insertPos = firstFenceIndex + 3 + doubleNewline;
      fixed = `${fixed.slice(0, insertPos)}\n\`\`\`\n${fixed.slice(insertPos)}`;
    } else {
      fixed = `${fixed}\n\`\`\``;
    }
  }

  return fixed;
};

interface Message {
  id: string;
  role: string;
  content: string;
  sqlQuery?: string | null;
  queryResult?: any;
  status?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
  isNew?: boolean;
}

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const [showSQL, setShowSQL] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showResult, setShowResult] = useState(message.isNew !== false);
  const [showChart, setShowChart] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);

  const isUser = message.role === "user";
  const isProcessing = message.status === "processing";
  const isError = message.status === "error";
  const isCompleted = message.status === "completed";

  // 模拟生成图表的接口调用
  const handleGenerateChart = async () => {
    setIsGeneratingChart(true);

    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟从接口获取的图表配置
    // 这里根据查询结果数据自动判断图表类型
    const data = message.queryResult;

    if (!data || !Array.isArray(data) || data.length === 0) {
      setIsGeneratingChart(false);
      return;
    }

    const columns = Object.keys(data[0]);

    // 如果只有1行数据，检查是否适合数字卡片展示
    if (data.length === 1) {
      // 单行单列或单行多列，使用数字卡片
      const config: ChartConfig = {
        type: 'stat',
        data: data,
      };
      setChartConfig(config);
      setShowChart(true);
      setIsGeneratingChart(false);
      return;
    }

    // 自动判断数据类型并生成图表配置
    // 如果数据有2列，第一列是文本，第二列是数字，使用饼图/径向图
    if (columns.length === 2) {
      const firstColSample = data[0][columns[0]];
      const secondColSample = data[0][columns[1]];

      // 判断第二列是否为数字
      if (typeof secondColSample === 'number' || !isNaN(Number(secondColSample))) {
        // 使用饼图，支持切换到径向图
        const config: ChartConfig = {
          type: 'pie',
          data: data.slice(0, 5), // 限制最多5项，避免图表过于拥挤
          nameKey: columns[0],
          valueKey: columns[1],
          supportedTypes: ['pie', 'radial'],
        };
        setChartConfig(config);
        setShowChart(true);
        setIsGeneratingChart(false);
        return;
      }
    }

    // 如果数据有多列，尝试使用柱状图/面积图
    if (columns.length >= 2) {
      // 找到第一个数字列作为 Y 轴
      let yKey = columns[1];
      for (let i = 1; i < columns.length; i++) {
        const sample = data[0][columns[i]];
        if (typeof sample === 'number' || !isNaN(Number(sample))) {
          yKey = columns[i];
          break;
        }
      }

      // 限制数据点数量，避免图表过于密集
      const limitedData = data.length > 20 ? data.slice(0, 20) : data;

      const config: ChartConfig = {
        type: 'bar',
        data: limitedData,
        xKey: columns[0],
        yKey: yKey,
        supportedTypes: ['bar', 'area'],
      };
      setChartConfig(config);
      setShowChart(true);
      setIsGeneratingChart(false);
      return;
    }

    setIsGeneratingChart(false);
  };

  if (isUser) {
    return (
      <div className="flex gap-4 p-4">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 pt-1">
          <div className="text-sm">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 bg-muted/30">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <Bot className="h-4 w-4" />
      </div>

      <div className="flex-1 space-y-4 overflow-hidden">
        {/* AI 回答内容 */}
        {message.content && (
          <div className="text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                code({ inline, className, children }) {
                  if (inline) {
                    // 行内代码当普通文本渲染，避免误判
                    return <span>{children}</span>;
                  }
                  return (
                    <pre className="my-2 rounded-md bg-muted p-3 text-xs overflow-auto">
                      <code className={className}>{children}</code>
                    </pre>
                  );
                },
                p({ children }) {
                  return <p className="mb-2">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="mb-2 list-disc pl-5 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-2 list-decimal pl-5 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
              }}
            >
              {normalizeMarkdown(message.content)}
            </ReactMarkdown>
          </div>
        )}

        {/* 处理中状态 */}
        {isProcessing && !message.content && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>正在处理您的查询...</span>
          </div>
        )}

        {/* SQL 查询展开区 */}
        {message.sqlQuery && (
          <div className="border rounded-lg overflow-hidden bg-background">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowSQL(!showSQL)}
            >
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {isProcessing && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className="text-sm font-medium">
                  {isProcessing ? "正在生成 SQL..." : "查看生成的 SQL"}
                </span>
              </div>
              {showSQL ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {showSQL && (
              <div className="border-t p-4 bg-muted/20">
                <pre className="text-sm overflow-x-auto">
                  <code className="language-sql">{message.sqlQuery}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {isError && message.errorMessage && (
          <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
            <div className="flex items-start gap-2">
              <div className="text-destructive text-sm font-medium">错误信息:</div>
            </div>
            <div className="mt-2 text-sm text-destructive/90">
              {message.errorMessage}
            </div>
          </div>
        )}

        {/* 查询结果 */}
        {message.queryResult && (
          <div className="border rounded-lg overflow-hidden bg-background">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowResult(!showResult)}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">查询结果</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateChart();
                  }}
                  disabled={isGeneratingChart}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isGeneratingChart ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-3 w-3" />
                      <span>生成图表</span>
                    </>
                  )}
                </button>
                {showResult ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {showResult && (
              <div className="border-t p-4 bg-muted/20 space-y-4">
                <QueryResultTable data={message.queryResult} />

                {/* 图表展示区域 */}
                {showChart && chartConfig && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">数据可视化</h4>
                    <ChartContainer config={chartConfig} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
