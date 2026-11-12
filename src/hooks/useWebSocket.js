import { useEffect, useRef, useState } from 'react';

export function useWebSocket(onAlertReceived) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onAlertReceivedRef = useRef(onAlertReceived);
  const isMountedRef = useRef(true);

  // Keep latest callback reference without retriggering socket reconnection
  useEffect(() => {
    onAlertReceivedRef.current = onAlertReceived;
  }, [onAlertReceived]);

  useEffect(() => {
    isMountedRef.current = true;

    function connect() {
      if (!isMountedRef.current) return;

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/alerts`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setIsConnected(true);

          // Ping every 25 seconds
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                ws.send('ping');
              } catch {
                // ignore
              }
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          if (event.data === 'pong') return;
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            if (data.type === 'NEW_ALERT' && onAlertReceivedRef.current) {
              onAlertReceivedRef.current(data.alert);
            }
          } catch {
            // Non-JSON message, safely ignore
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

          // Reconnect with safe backoff (6 seconds)
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, 6000);
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {
            // ignore
          }
        };
      } catch {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      isMountedRef.current = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { isConnected, lastMessage };
}
