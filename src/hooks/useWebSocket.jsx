import { useEffect, useRef, useCallback, useState } from "react";
import { useAtom } from "jotai";

import { roomIdAtom, userIdAtom } from "../atoms/atoms";

export default function useWebSocket() {
  const [roomId] = useAtom(roomIdAtom);
  const [userId] = useAtom(userIdAtom);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL;
    const ws = new WebSocket(WS_SERVER_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "joinRoom", roomId, userId }));
      setIsConnected(true);
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    connectWebSocket();

    const reconnectInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }
    }, 5000);

    return () => {
      clearInterval(reconnectInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback((message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const setOnMessage = useCallback((handler) => {
    if (socketRef.current) {
      socketRef.current.onmessage = handler;
    }
  }, []);

  return { sendMessage, setOnMessage, isConnected };
}
