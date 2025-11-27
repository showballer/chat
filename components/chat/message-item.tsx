"use client";

import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";
import { QueryResultTable } from "./query-result-table";

interface Message {
  id: string;
  role: string;
  content: string;
  sqlQuery?: string | null;
  queryResult?: any;
  status?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
}

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const isProcessing = message.status === "processing";
  const isError = message.status === "error";

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg transition-colors",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>处理中...</span>
          </div>
        )}

        {message.sqlQuery && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">生成的SQL:</div>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm">
              <code>{message.sqlQuery}</code>
            </pre>
          </div>
        )}

        {isError && message.errorMessage && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {message.errorMessage}
          </div>
        )}

        {message.queryResult && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">查询结果:</div>
            <QueryResultTable data={message.queryResult} />
          </div>
        )}
      </div>
    </div>
  );
}
