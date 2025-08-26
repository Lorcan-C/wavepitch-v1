// Main integration hook (most common usage)
export { useAudioRecording } from './integration/useAudioRecording';
export type { AudioRecordingConfig } from './integration/useAudioRecording';

// Core hooks for advanced usage
export { useAudioPermissions } from './core/useAudioPermissions';
export { useAudioStream } from './core/useAudioStream';
export { useAudioRecorder } from './core/useAudioRecorder';

// Enhancement hooks
export { useAudioLevelMonitor } from './enhancements/useAudioLevelMonitor';

// Utilities
export * from './utils/audioUtils';
export * from './utils/audioConstants';