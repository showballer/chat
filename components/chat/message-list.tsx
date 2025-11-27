"use client";

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
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ScrollArea className="flex-1 px-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">开始新对话</h3>
              <p className="text-sm">输入您的查询需求开始使用</p>
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
