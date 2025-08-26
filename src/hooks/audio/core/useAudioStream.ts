import { useCallback, useRef, useState } from 'react';
import { AUDIO_CONFIG, ERROR_MESSAGES } from '../utils/audioConstants';

export interface AudioStreamConfig {
  sampleRate?: number;
  channelCount?: number;
}

export interface AudioStreamState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
}

export const useAudioStream = (config: AudioStreamConfig = {}) => {
  const {
    sampleRate = AUDIO_CONFIG.DEFAULT_SAMPLE_RATE,
    channelCount = AUDIO_CONFIG.DEFAULT_CHANNELS,
  } = config;

  const [state, setState] = useState<AudioStreamState>({
    stream: null,
    isActive: false,
    error: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount,
          ...AUDIO_CONFIG.AUDIO_CONSTRAINTS,
        },
      });

      streamRef.current = stream;
      setState({
        stream,
        isActive: true,
        error: null,
      });

      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.name === 'NotAllowedError'
          ? ERROR_MESSAGES.PERMISSION_DENIED
          : error.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;

      setState({
        stream: null,
        isActive: false,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  }, [sampleRate, channelCount]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState({
      stream: null,
      isActive: false,
      error: null,
    });
  }, []);

  const cleanup = useCallback(() => {
    stopStream();
  }, [stopStream]);

  return {
    ...state,
    startStream,
    stopStream,
    cleanup,
  };
};