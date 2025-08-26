import { useCallback, useRef } from 'react';
import { useWebSocket, WebSocketConfig } from './useWebSocket';
import { calculateReconnectDelay, shouldReconnect } from '../utils/websocketUtils';

export interface WebSocketConnectionConfig extends Omit<WebSocketConfig, 'onClose'> {
  maxReconnectAttempts?: number;
  onConnectionChange?: (connected: boolean) => void;
}

export const useWebSocketConnection = (config: WebSocketConnectionConfig = {}) => {
  const {
    maxReconnectAttempts = 3,
    onConnectionChange,
    onError,
    ...webSocketConfig
  } = config;

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const webSocket = useWebSocket({
    ...webSocketConfig,
    onOpen: () => {
      reconnectAttempts.current = 0;
      onConnectionChange?.(true);
      webSocketConfig.onOpen?.();
    },
    onClose: (event) => {
      onConnectionChange?.(false);

      if (shouldReconnect(event.code, reconnectAttempts.current, maxReconnectAttempts)) {
        reconnectAttempts.current++;
        const delay = calculateReconnectDelay(reconnectAttempts.current);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          webSocket.connect();
        }, delay);
      }
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    webSocket.disconnect();
  }, [webSocket.disconnect]);

  return {
    ...webSocket,
    disconnect,
  };
};