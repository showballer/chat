"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { QueryResultTable } from "./query-result-table";
import ReactMarkdown from "react-markdown";

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

  const isUser = message.role === "user";
  const isProcessing = message.status === "processing";
  const isError = message.status === "error";
  const isCompleted = message.status === "completed";

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
                    return (
                      <code className="px-1 py-0.5 rounded bg-muted text-xs">
                        {children}
                      </code>
                    );
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
              {message.content}
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
              {showResult ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {showResult && (
              <div className="border-t p-4 bg-muted/20">
                <QueryResultTable data={message.queryResult} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
