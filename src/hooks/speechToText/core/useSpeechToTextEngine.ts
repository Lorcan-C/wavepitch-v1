import { useCallback, useEffect } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useTranscriptState } from './useTranscriptState';
import { TranscriptResult } from '../utils/transcriptUtils';

export interface SpeechToTextEngineConfig {
  language: string;
  operatingPoint: string;
  enablePartials: boolean;
  maxReconnectAttempts: number;
  onTranscript?: (result: TranscriptResult) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useSpeechToTextEngine = (config: SpeechToTextEngineConfig) => {
  const {
    language,
    operatingPoint,
    enablePartials,
    maxReconnectAttempts,
    onTranscript,
    onError,
    onConnectionChange,
  } = config;

  const transcriptState = useTranscriptState({ onTranscript });
  
  const webSocket = useWebSocketConnection({
    maxReconnectAttempts,
    onMessage: transcriptState.updateTranscript,
    onError,
    onConnectionChange,
  });

  const connect = useCallback(async () => {
    await webSocket.connect();
    
    // Send configuration after connection
    webSocket.send(JSON.stringify({
      type: 'configure',
      language,
      operatingPoint,
      enablePartials,
    }));
  }, [webSocket.connect, webSocket.send, language, operatingPoint, enablePartials]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webSocket.disconnect();
    };
  }, [webSocket.disconnect]);

  return {
    // Connection state
    isConnected: webSocket.isConnected,
    isConnecting: webSocket.isConnecting,
    error: webSocket.error,

    // Transcript state  
    transcript: transcriptState.transcript,

    // Actions
    connect,
    disconnect: webSocket.disconnect,
    sendAudioData: webSocket.send,
    resetTranscript: transcriptState.resetTranscript,
  };
};