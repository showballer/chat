"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onNewConversation} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          新建对话
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              暂无历史对话
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer",
                  currentConversationId === conversation.id &&
                    "bg-muted font-medium"
                )}
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{conversation.title}</span>
                {hoveredId === conversation.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t text-xs text-muted-foreground">
        <div className="font-medium mb-1">ChatBI</div>
        <div>基于自然语言的数据库查询系统</div>
      </div>
    </div>
  );
}
