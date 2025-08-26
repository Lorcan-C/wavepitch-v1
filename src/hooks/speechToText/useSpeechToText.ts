import { useSpeechToTextEngine } from './core/useSpeechToTextEngine';
import { TranscriptResult } from './utils/transcriptUtils';

export interface SpeechToTextConfig {
  language?: string;
  operatingPoint?: string;
  enablePartials?: boolean;
  maxReconnectAttempts?: number;
  onTranscript?: (result: TranscriptResult) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useSpeechToText = (config: SpeechToTextConfig = {}) => {
  const {
    language = 'en',
    operatingPoint = 'enhanced', 
    enablePartials = true,
    maxReconnectAttempts = 3,
    ...callbacks
  } = config;

  const engine = useSpeechToTextEngine({
    language,
    operatingPoint,
    enablePartials,
    maxReconnectAttempts,
    ...callbacks,
  });

  return {
    // Connection state
    isConnected: engine.isConnected,
    isConnecting: engine.isConnecting,
    error: engine.error,

    // Transcript (clean API)
    currentTranscript: engine.transcript.current,
    finalTranscript: engine.transcript.final,
    partialTranscript: engine.transcript.partial,

    // Actions
    connect: engine.connect,
    disconnect: engine.disconnect,
    sendAudioData: engine.sendAudioData,
    resetTranscript: engine.resetTranscript,
  };
};