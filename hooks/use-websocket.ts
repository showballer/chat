"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface WebSocketMessage {
  type: string;
  content: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: string) => void;
  onComplete?: (data: { sql?: string; result?: any }) => void;
  onError?: (error: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const hasShownErrorRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Don't show error toast on initial connection attempts
    if (reconnectAttempts.current === 0) {
      console.log("Attempting to connect to WebSocket...");
    }

    try {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://172.31.24.111:12224/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        reconnectAttempts.current = 0;
        hasShownErrorRef.current = false;
      };

      ws.onmessage = (event) => {
        const message = event.data;
        console.log("WebSocket message:", message);

        if (message === "DONE") {
          setIsProcessing(false);
          return;
        }

        // Handle different message types
        if (message.includes("最终SQL语句:")) {
          const sql = message.replace("最终SQL语句:", "").trim();
          options.onMessage?.(message);
        } else if (message.includes("SQL查询成功")) {
          options.onMessage?.(message);
        } else if (message.includes("查询失败") || message.includes("异常")) {
          options.onError?.(message);
          options.onMessage?.(message);
        } else {
          // Stream SQL generation or status messages
          options.onMessage?.(message);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        // Only show toast once to avoid spam
        if (!hasShownErrorRef.current && reconnectAttempts.current > 0) {
          hasShownErrorRef.current = true;
          toast({
            variant: "destructive",
            title: "连接错误",
            description: "WebSocket 服务器连接失败，请检查服务器是否运行",
          });
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setIsProcessing(false);

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(2000 * reconnectAttempts.current, 10000);
          console.log(`Will retry connection in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          // Only show final error if not already shown
          if (!hasShownErrorRef.current) {
            hasShownErrorRef.current = true;
            toast({
              variant: "destructive",
              title: "无法连接到 WebSocket 服务器",
              description: "请确保 WebSocket 服务器正在运行，或在连接后使用系统",
            });
          }
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setIsConnected(false);
    }
  }, [options, toast]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendQuery = useCallback((query: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        variant: "destructive",
        title: "连接未建立",
        description: "请等待 WebSocket 连接建立",
      });
      return false;
    }

    try {
      setIsProcessing(true);
      const message = JSON.stringify({
        type: "query",
        query: query,
      });
      wsRef.current.send(message);
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "发送失败",
        description: "消息发送失败，请重试",
      });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isProcessing,
    sendQuery,
    connect,
    disconnect,
  };
}
