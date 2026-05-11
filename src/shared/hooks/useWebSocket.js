import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const useWebSocket = (tenantId) => {
  const socketRef = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    if (!tenantId) return;

    const ws = new WebSocket(`${WS_URL}/${tenantId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    ws.onclose = () => {
      console.log('WS Disconnected');
      setIsConnected(false);
      socketRef.current = null;
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        setReconnectCount(prev => prev + 1);
      }, 5000);
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [tenantId, reconnectCount]);

  const sendMessage = useCallback((message) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  return { lastMessage, isConnected, sendMessage };
};
