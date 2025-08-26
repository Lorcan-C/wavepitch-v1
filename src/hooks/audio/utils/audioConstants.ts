export const AUDIO_CONFIG = {
  DEFAULT_SAMPLE_RATE: 16000,
  DEFAULT_CHANNELS: 1,
  DEFAULT_TIMESLICE: 100, // ms between chunks
  AUDIO_LEVEL_UPDATE_INTERVAL: 50, // ms
  FFT_SIZE: 256,
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const;

export const MIME_TYPES = {
  WEBM: 'audio/webm',
  MP4: 'audio/mp4',
  WAV: 'audio/wav',
} as const;

export const ERROR_MESSAGES = {
  NOT_SUPPORTED: 'Audio recording not supported in this browser',
  PERMISSION_DENIED: 'Microphone access denied',
  MEDIA_RECORDER_ERROR: 'MediaRecorder error occurred',
  AUDIO_CONTEXT_ERROR: 'Audio context initialization failed',
  UNKNOWN_ERROR: 'Unknown audio error occurred',
} as const;