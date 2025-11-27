"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/chat/sidebar";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  sqlQuery?: string | null;
  queryResult?: any;
  status?: string | null;
  errorMessage?: string | null;
  createdAt: Date;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const currentMessageIdRef = useRef<string | null>(null);
  const sqlStreamRef = useRef<string>("");

  const handleWebSocketMessage = useCallback(async (message: string) => {
    console.log("📨 WS Message:", message);

    if (!currentMessageIdRef.current) return;

    // 1. 思考过程消息（不在主内容显示，仅更新状态）
    if (
      message.includes("正在处理查询请求") ||
      message.includes("正在调用text2sql模型") ||
      message.includes("正在执行SQL查询") ||
      message.includes("正在尝试重写SQL") ||
      message.includes("正在执行重写后的SQL")
    ) {
      console.log("🤔 Thinking:", message);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, status: "processing" }
            : msg
        )
      );
      return;
    }

    // 2. DONE 标记（SQL 生成完成）
    if (message === "DONE") {
      console.log("✅ SQL generation completed");
      return;
    }

    // 3. 最终 SQL 语句
    if (message.includes("最终SQL语句:")) {
      const sql = message.replace("最终SQL语句:", "").trim().replace(/```sql|```/g, "");
      console.log("💾 Final SQL:", sql);

      await fetch(`/api/messages/${currentMessageIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sqlQuery: sql,
          content: "根据您的查询需求，我已生成并执行了相应的 SQL 语句。",
        }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? {
                ...msg,
                sqlQuery: sql,
                content: "根据您的查询需求，我已生成并执行了相应的 SQL 语句。",
              }
            : msg
        )
      );

      // 清空流式SQL累积
      sqlStreamRef.current = "";
      return;
    }

    // 4. 查询成功
    if (message.includes("SQL查询成功") || message.includes("查询成功")) {
      const match = message.match(/结果行数[：:]\s*(\d+)/);
      const rowCount = match ? match[1] : "未知";
      console.log("✅ Query success, rows:", rowCount);

      await fetch(`/api/messages/${currentMessageIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          content: `查询执行成功！共返回 ${rowCount} 条数据记录。`,
        }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? {
                ...msg,
                status: "completed",
                content: `查询执行成功！共返回 ${rowCount} 条数据记录。`,
              }
            : msg
        )
      );
      return;
    }

    // 5. 查询失败
    if (message.includes("SQL查询失败") || message.includes("查询失败")) {
      console.log("❌ Query failed:", message);

      await fetch(`/api/messages/${currentMessageIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "error",
          errorMessage: message,
          content: "查询执行失败，请查看错误详情。",
        }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? {
                ...msg,
                status: "error",
                errorMessage: message,
                content: "查询执行失败，请查看错误详情。",
              }
            : msg
        )
      );
      return;
    }

    // 6. SQL 重写相关信息
    if (message.includes("重写的SQL") || message.includes("模型重写")) {
      console.log("🔄 SQL rewrite info:", message);
      return;
    }

    // 7. 异常处理
    if (message.includes("异常") || message.includes("错误")) {
      console.log("⚠️ Exception:", message);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? {
                ...msg,
                status: "error",
                errorMessage: message,
                content: "处理过程中发生异常。",
              }
            : msg
        )
      );
      return;
    }

    // 8. 流式 SQL 生成片段（累积显示）
    sqlStreamRef.current += message;
    console.log("📝 SQL Stream chunk:", message);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === currentMessageIdRef.current
          ? { ...msg, sqlQuery: sqlStreamRef.current }
          : msg
      )
    );
  }, []);

  const handleWebSocketError = useCallback(async (error: string) => {
    if (!currentMessageIdRef.current) return;

    await fetch(`/api/messages/${currentMessageIdRef.current}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "error",
        errorMessage: error,
        content: "连接或处理过程中发生错误。",
      }),
    });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === currentMessageIdRef.current
          ? {
              ...msg,
              status: "error",
              errorMessage: error,
              content: "连接或处理过程中发生错误。",
            }
          : msg
      )
    );

    currentMessageIdRef.current = null;
    sqlStreamRef.current = "";
  }, []);

  const { isConnected, isProcessing, sendQuery } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      setConversations(data);

      if (data.length > 0 && !currentConversation) {
        loadConversation(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "无法加载历史对话",
      });
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const data = await response.json();
      setCurrentConversation(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "无法加载对话内容",
      });
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
      });
      const newConversation = await response.json();
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast({
        variant: "destructive",
        title: "创建失败",
        description: "无法创建新对话",
      });
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      setConversations(conversations.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "无法删除对话",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    // 如果没有当前对话，先创建一个
    let targetConversation = currentConversation;
    if (!targetConversation) {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
        });
        const newConversation = await response.json();
        setConversations((prev) => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        targetConversation = newConversation;
      } catch (error) {
        console.error("Failed to create conversation:", error);
        toast({
          variant: "destructive",
          title: "创建失败",
          description: "无法创建新对话",
        });
        return;
      }
    }

    try {
      // Create user message
      const userMessageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: targetConversation.id,
          role: "user",
          content: content,
        }),
      });
      const userMessage = await userMessageResponse.json();
      setMessages((prev) => [...prev, userMessage]);

      // Create assistant message placeholder
      const assistantMessageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: targetConversation.id,
          role: "assistant",
          content: "正在处理您的查询...",
          status: "processing",
        }),
      });
      const assistantMessage = await assistantMessageResponse.json();
      setMessages((prev) => [...prev, assistantMessage]);

      currentMessageIdRef.current = assistantMessage.id;
      sqlStreamRef.current = "";

      // Send query via WebSocket
      sendQuery(content);

      // Update conversation title with first message (only once)
      if (messages.length === 0) {
        const newTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        await fetch(`/api/conversations/${targetConversation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
          }),
        });

        // Update local state instead of refetching
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === targetConversation.id
              ? { ...conv, title: newTitle }
              : conv
          )
        );
        setCurrentConversation((prev) =>
          prev ? { ...prev, title: newTitle } : prev
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        variant: "destructive",
        title: "发送失败",
        description: "消息发送失败，请重试",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 bg-background">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {currentConversation?.title || "ChatBI"}
            </h1>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "已连接" : "未连接"}
              </span>
            </div>
          </div>
        </div>
        <MessageList messages={messages} />
        <ChatInput onSend={handleSendMessage} disabled={!isConnected || isProcessing} />
      </div>
    </div>
  );
}
