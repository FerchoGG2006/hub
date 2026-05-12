/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export const useWebSocket = (tenantId) => {
  const socketRef = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [status, setStatus] = useState('disconnected'); 
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef(null);

  const connect = useCallback(() => {
    if (!tenantId || socketRef.current) return;

    setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');
    
    const ws = new WebSocket(`${WS_URL}/${tenantId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WS Connected');
      setStatus('connected');
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error("WS Parse Error:", err);
      }
    };

    ws.onclose = () => {
      console.log('WS Disconnected');
      setStatus('disconnected');
      socketRef.current = null;
      
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        if (connectRef.current) connectRef.current(); 
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

  }, [tenantId]);

  // Sincronizar el ref con la función actual
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  return { lastMessage, status, isConnected: status === 'connected', sendMessage };
};
