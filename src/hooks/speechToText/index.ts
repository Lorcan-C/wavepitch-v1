// Main public API
export { useSpeechToText } from './useSpeechToText';
export type { SpeechToTextConfig } from './useSpeechToText';

// Core hooks for advanced usage
export { useWebSocket } from './core/useWebSocket';
export { useWebSocketConnection } from './core/useWebSocketConnection';
export { useTranscriptState } from './core/useTranscriptState';

// Types and utilities
export type { TranscriptResult, TranscriptState } from './utils/transcriptUtils';
export * from './utils/websocketUtils';