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
  const sqlContentRef = useRef<string>("");
  const fullContentRef = useRef<string>("");

  const handleWebSocketMessage = useCallback(async (message: string) => {
    console.log("Handling message:", message);

    if (!currentMessageIdRef.current) return;

    // Accumulate SQL generation content
    if (
      !message.includes("正在") &&
      !message.includes("DONE") &&
      !message.includes("最终SQL语句") &&
      !message.includes("查询成功") &&
      !message.includes("查询失败")
    ) {
      sqlContentRef.current += message;
      fullContentRef.current += message + "\n";
    } else {
      fullContentRef.current += message + "\n";
    }

    // Update message content in real-time
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === currentMessageIdRef.current
          ? { ...msg, content: fullContentRef.current }
          : msg
      )
    );

    // Handle final SQL
    if (message.includes("最终SQL语句:")) {
      const sql = message.replace("最终SQL语句:", "").trim();
      await fetch(`/api/messages/${currentMessageIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sqlQuery: sql,
          content: fullContentRef.current,
        }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, sqlQuery: sql, content: fullContentRef.current }
            : msg
        )
      );
    }

    // Handle query success
    if (message.includes("查询成功")) {
      await fetch(`/api/messages/${currentMessageIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          content: fullContentRef.current,
        }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, status: "completed", content: fullContentRef.current }
            : msg
        )
      );
    }
  }, []);

  const handleWebSocketError = useCallback(async (error: string) => {
    if (!currentMessageIdRef.current) return;

    await fetch(`/api/messages/${currentMessageIdRef.current}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "error",
        errorMessage: error,
        content: fullContentRef.current,
      }),
    });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === currentMessageIdRef.current
          ? {
              ...msg,
              status: "error",
              errorMessage: error,
              content: fullContentRef.current,
            }
          : msg
      )
    );

    currentMessageIdRef.current = null;
    sqlContentRef.current = "";
    fullContentRef.current = "";
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
    if (!currentConversation) {
      await handleNewConversation();
      return;
    }

    try {
      // Create user message
      const userMessageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversation.id,
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
          conversationId: currentConversation.id,
          role: "assistant",
          content: "",
          status: "processing",
        }),
      });
      const assistantMessage = await assistantMessageResponse.json();
      setMessages((prev) => [...prev, assistantMessage]);

      currentMessageIdRef.current = assistantMessage.id;
      sqlContentRef.current = "";
      fullContentRef.current = "";

      // Send query via WebSocket
      sendQuery(content);

      // Update conversation title with first message
      if (messages.length === 0) {
        await fetch(`/api/conversations/${currentConversation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
          }),
        });
        loadConversations();
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
