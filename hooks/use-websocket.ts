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
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Test server availability once on mount
  const testServerAvailability = useCallback(() => {
    console.log("Testing WebSocket server availability...");
    const testWs = new WebSocket(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://172.31.24.111:12224/ws"
    );

    const timeout = setTimeout(() => {
      if (testWs.readyState !== WebSocket.OPEN) {
        testWs.close();
        setServerAvailable(false);
        console.log("❌ WebSocket server is not available");
      }
    }, 3000);

    testWs.onopen = () => {
      clearTimeout(timeout);
      setServerAvailable(true);
      console.log("✅ WebSocket server is available");
      // Close test connection immediately
      testWs.close();
    };

    testWs.onerror = () => {
      clearTimeout(timeout);
      setServerAvailable(false);
      console.log("❌ WebSocket server connection failed");
    };
  }, []);

  // Create a new WebSocket connection for a query
  const createConnection = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      console.log("Creating new WebSocket connection...");
      const ws = new WebSocket(
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://172.31.24.111:12224/ws"
      );

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Connection timeout"));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        console.log("✅ WebSocket connected");
        wsRef.current = ws;
        setServerAvailable(true);
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error("❌ WebSocket connection error:", error);
        setServerAvailable(false);
        reject(error);
      };

      ws.onmessage = (event) => {
        const message = event.data;
        console.log("📨 WebSocket message:", message);

        if (message === "DONE") {
          setIsProcessing(false);
          // Close connection after query completes
          setTimeout(() => {
            ws.close();
            wsRef.current = null;
          }, 1000);
          return;
        }

        // Handle different message types
        if (message.includes("最终SQL语句:")) {
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

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsProcessing(false);
        wsRef.current = null;
      };
    });
  }, [options]);

  const sendQuery = useCallback(
    async (query: string) => {
      try {
        setIsProcessing(true);

        // Create new connection for this query
        const ws = await createConnection();

        const message = JSON.stringify({
          type: "query",
          query: query,
        });

        ws.send(message);
        console.log("📤 Query sent:", query);
        return true;
      } catch (error) {
        console.error("Failed to send query:", error);
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "发送失败",
          description: "无法连接到服务器，请确保 WebSocket 服务正在运行",
        });
        return false;
      }
    },
    [createConnection, toast]
  );

  // Test server on mount
  useEffect(() => {
    testServerAvailability();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [testServerAvailability]);

  return {
    isConnected: serverAvailable === true,
    isProcessing,
    sendQuery,
    serverAvailable,
  };
}
