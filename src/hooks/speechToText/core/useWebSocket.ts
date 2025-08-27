import { useCallback, useRef, useState } from 'react';

import { createWebSocketUrl } from '../utils/websocketUtils';

export interface WebSocketConfig {
  endpoint?: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: string) => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useWebSocket = (config: WebSocketConfig = {}) => {
  const { endpoint = '/api/speechmatics-ws', onMessage, onOpen, onClose, onError } = config;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((): Promise<void> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = createWebSocketUrl(endpoint);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          setState((prev) => ({ ...prev, isConnected: true, isConnecting: false }));
          onOpen?.();
          resolve();
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage?.(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        wsRef.current.onerror = () => {
          const error = 'WebSocket connection error';
          setState((prev) => ({ ...prev, error, isConnecting: false }));
          onError?.(error);
          reject(new Error(error));
        };

        wsRef.current.onclose = (event) => {
          setState((prev) => ({ ...prev, isConnected: false, isConnecting: false }));
          onClose?.(event);
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        setState((prev) => ({ ...prev, error: errorMessage, isConnecting: false }));
        onError?.(errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }, [endpoint, onMessage, onOpen, onClose, onError]);

  const send = useCallback((data: string | ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
  }, []);

  return { ...state, connect, send, disconnect };
};
