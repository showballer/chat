"use client";

import { Database } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageItem } from "./message-item";

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

interface MessageListProps {
  messages: Message[];
  onSuggestionClick?: (content: string) => void;
  disabled?: boolean;
}

export function MessageList({
  messages,
  onSuggestionClick,
  disabled,
}: MessageListProps) {
  const suggestions = [
    "查询所有员工信息",
    "统计各部门人数",
    "查询技术部员工",
    "按薪资排序查询",
  ];

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="max-w-4xl mx-auto py-10 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
            <div className="w-full space-y-10">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Database className="h-7 w-7" />
                </div>
                <div className="space-y-4 text-foreground">
                  <h3 className="text-4xl font-semibold bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                    数据查询助手
                  </h3>
                  <p className="text-base text-muted-foreground">
                    输入自然语言查询，我会为你生成SQL并返回结果
                  </p>
                </div>
              </div>
              <div className="mx-auto max-w-3xl space-y-4 text-left">
                <p className="text-sm font-medium text-muted-foreground pl-1">
                  试试这些问题：
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSuggestionClick?.(item)}
                      className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
