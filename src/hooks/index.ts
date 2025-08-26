// Main speech-to-text hook using official Speechmatics SDK
export { useSpeechToText } from './useSpeechToText';
export type { SpeechToTextConfig } from './useSpeechToText';

// Existing TTS hook
export { useTTS } from './useTTS';

// Legacy modular audio hooks (for reference/advanced usage)
export * from './audio';
export * from './speechToText';