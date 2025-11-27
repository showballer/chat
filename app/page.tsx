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
  isNew?: boolean;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const currentMessageIdRef = useRef<string | null>(null);
  const aiAnswerRef = useRef<string>("");
  const sqlCodeBlockRef = useRef<string>("");
  const inSqlCodeBlock = useRef<boolean>(false);

  const handleWebSocketMessage = useCallback(async (message: string) => {
    console.log("📨 WS Message:", message);
    const trimmedMessage = message.trim();

    if (!currentMessageIdRef.current) return;

    // 1. 固定标志消息（不显示）
    if (
      message.includes("正在处理查询请求") ||
      message.includes("正在调用text2sql模型")
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

    // 2. 正在执行SQL查询
    if (message.includes("正在执行SQL查询")) {
      console.log("⏳ Executing SQL...");
      return;
    }

    // 3. DONE 标记（AI 流式回答结束）
    if (trimmedMessage === "DONE") {
      console.log("✅ AI answer completed");

      const messageId = currentMessageIdRef.current;
      // 处理 AI 回答，移除其中的 SQL 代码块
      let finalAnswer = aiAnswerRef.current;
      const sqlBlockMatch = finalAnswer.match(/```(?:sql)?\s*([\s\S]*?)\s*```/i);

      if (sqlBlockMatch) {
        // 提取 SQL 到单独的字段
        const extractedSql = sqlBlockMatch[1].trim();
        sqlCodeBlockRef.current = extractedSql;

        // 从 AI 回答中移除 SQL 代码块
        finalAnswer = finalAnswer.replace(/```(?:sql)?\s*[\s\S]*?\s*```/i, '').trim();

        console.log("📝 Extracted SQL from answer:", extractedSql);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: finalAnswer,
                  sqlQuery: extractedSql,
                  status: "completed",
                }
              : msg
          )
        );

        await fetch(`/api/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: finalAnswer,
            sqlQuery: extractedSql,
            status: "completed",
          }),
        });
      } else if (finalAnswer) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: finalAnswer, status: "completed" }
              : msg
          )
        );

        await fetch(`/api/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: finalAnswer,
            status: "completed",
          }),
        });
      } else {
        // 没有正文时也要标记完成，且保留已累积的 SQL
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: "completed",
                  sqlQuery: sqlCodeBlockRef.current || msg.sqlQuery,
                }
              : msg
          )
        );

        await fetch(`/api/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "completed",
            sqlQuery: sqlCodeBlockRef.current || null,
          }),
        });
      }
      return;
    }

    // 4. 最终 SQL 语句
    if (message.includes("最终SQL语句:")) {
      const sql = message.replace("最终SQL语句:", "").trim();
      console.log("💾 Final SQL:", sql);
      sqlCodeBlockRef.current = sql;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? {
                ...msg,
                sqlQuery: sql,
                status: "completed",
              }
            : msg
        )
      );

      await fetch(`/api/messages/${currentMessageIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sqlQuery: sql,
        }),
      });
      return;
    }

    // 5. JSON 格式的查询结果
    if (trimmedMessage.startsWith("{") && message.includes("query_result")) {
      try {
        // 尝试解析 JSON
        const result = JSON.parse(message);
        console.log("📊 Query Result:", result);

        // 如果还没有处理过 DONE（AI 回答中可能包含 SQL 代码块）
        if (aiAnswerRef.current) {
          const sqlBlockMatch = aiAnswerRef.current.match(/```(?:sql)?\s*([\s\S]*?)\s*```/i);
          if (sqlBlockMatch) {
            const extractedSql = sqlBlockMatch[1].trim();
            sqlCodeBlockRef.current = extractedSql;
            aiAnswerRef.current = aiAnswerRef.current
              .replace(/```(?:sql)?\s*[\s\S]*?\s*```/i, '')
              .trim();
            console.log("📝 Extracted SQL from answer before result:", extractedSql);
          }
        }

        if (result.status === "success") {
          if (result.sql) {
            sqlCodeBlockRef.current = result.sql;
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessageIdRef.current
                ? {
                    ...msg,
                    status: "completed",
                    content: aiAnswerRef.current || "",
                    queryResult: result.result,
                    sqlQuery: result.sql || sqlCodeBlockRef.current || msg.sqlQuery,
                  }
                : msg
            )
          );

          await fetch(`/api/messages/${currentMessageIdRef.current}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "completed",
              content: aiAnswerRef.current || "",
              queryResult: result.result,
              sqlQuery: result.sql || sqlCodeBlockRef.current || null,
            }),
          });
        } else if (result.status === "error") {
          await fetch(`/api/messages/${currentMessageIdRef.current}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "error",
              content: aiAnswerRef.current || "",
              errorMessage: result.error,
            }),
          });

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentMessageIdRef.current
                ? {
                    ...msg,
                    status: "error",
                    content: aiAnswerRef.current || "",
                    errorMessage: result.error,
                  }
                : msg
            )
          );
        }
      } catch (e) {
        console.error("Failed to parse JSON result:", e);
      }
      return;
    }

    // 6. FLAG_DONE 标记（对话结束）
    if (trimmedMessage === "FLAG_DONE") {
      console.log("🏁 Conversation ended");
      if (currentMessageIdRef.current) {
        // 如果还在 processing，确保标记完成
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentMessageIdRef.current
              ? { ...msg, status: msg.status === "processing" ? "completed" : msg.status }
              : msg
          )
        );
      }
      currentMessageIdRef.current = null;
      aiAnswerRef.current = "";
      sqlCodeBlockRef.current = "";
      inSqlCodeBlock.current = false;
      return;
    }

    // 7. 检测 SQL 代码块标记（支持分片的 ``` + sql 开头）
    if (trimmedMessage.startsWith("```")) {
      if (!inSqlCodeBlock.current) {
        inSqlCodeBlock.current = true;
        sqlCodeBlockRef.current = "";
        console.log("📝 SQL code block started");
      } else {
        inSqlCodeBlock.current = false;
        console.log("✅ SQL code block ended");
      }
      return;
    }

    // 8. 流式内容处理
    if (inSqlCodeBlock.current) {
      // 在 SQL 代码块内，累积到 SQL
      if (
        sqlCodeBlockRef.current === "" &&
        trimmedMessage.toLowerCase() === "sql"
      ) {
        // 跳过语言标识
        return;
      }
      sqlCodeBlockRef.current += message;
      console.log("📝 SQL chunk:", message);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, sqlQuery: sqlCodeBlockRef.current.trim() }
            : msg
        )
      );
    } else {
      // 不在 SQL 代码块内，累积到 AI 回答
      aiAnswerRef.current += message;
      console.log("💬 AI chunk:", message);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, content: aiAnswerRef.current.trim() }
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
    aiAnswerRef.current = "";
    sqlCodeBlockRef.current = "";
    inSqlCodeBlock.current = false;
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
      setMessages((data.messages || []).map((msg: Message) => ({ ...msg, isNew: false })));
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
      setMessages((prev) => [...prev, { ...userMessage, isNew: true }]);

      // Create assistant message placeholder
      const assistantMessageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: targetConversation.id,
          role: "assistant",
          content: "",
          status: "processing",
        }),
      });
      const assistantMessage = await assistantMessageResponse.json();
      setMessages((prev) => [...prev, { ...assistantMessage, isNew: true }]);

      currentMessageIdRef.current = assistantMessage.id;
      aiAnswerRef.current = "";
      sqlCodeBlockRef.current = "";
      inSqlCodeBlock.current = false;

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
