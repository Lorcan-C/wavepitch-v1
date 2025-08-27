import { MIME_TYPES } from './audioConstants';

export const detectBrowserSupport = () => {
  const hasMediaDevices =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasAudioContext =
    typeof AudioContext !== 'undefined' ||
    typeof (window as Window & { webkitAudioContext?: typeof AudioContext })?.webkitAudioContext !==
      'undefined';

  return {
    isSupported: hasMediaDevices,
    hasMediaRecorder,
    hasAudioContext,
    needsFallback:
      hasMediaDevices && (!hasMediaRecorder || !MediaRecorder.isTypeSupported?.(MIME_TYPES.WEBM)),
  };
};

export const getSupportedMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return MIME_TYPES.WAV;

  const types = [MIME_TYPES.WEBM, MIME_TYPES.MP4, MIME_TYPES.WAV];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || MIME_TYPES.WAV;
};

export const convertToPCM16 = (audioBuffer: AudioBuffer): ArrayBuffer => {
  const length = audioBuffer.length;
  const pcm16 = new Int16Array(length);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return pcm16.buffer;
};

export const createAudioContext = (sampleRate: number): AudioContext => {
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return new AudioContextClass({ sampleRate });
};

export const normalizeAudioLevel = (dataArray: Uint8Array): number => {
  const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
  return average / 255;
};
