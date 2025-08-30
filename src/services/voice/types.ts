export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer';

export interface TTSConfig {
  modelName: string;
  voice: OpenAIVoice;
  responseFormat: 'aac' | 'mp3' | 'opus' | 'flac';
  speed: number;
  bufferSize: number;
  sentenceEndings: string[];
  chunkSize: number;
}

export interface StreamingTTSChunk {
  type: 'audio' | 'complete' | 'error';
  data?: Uint8Array;
  error?: string;
}
