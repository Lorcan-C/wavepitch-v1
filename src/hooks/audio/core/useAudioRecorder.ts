import { useCallback, useRef, useState } from 'react';
import { detectBrowserSupport, getSupportedMimeType, convertToPCM16, createAudioContext } from '../utils/audioUtils';
import { AUDIO_CONFIG, ERROR_MESSAGES } from '../utils/audioConstants';

export interface AudioRecorderConfig {
  timeslice?: number;
  onDataAvailable?: (data: ArrayBuffer) => void;
  onError?: (error: string) => void;
}

export interface AudioRecorderState {
  isRecording: boolean;
  error: string | null;
}

export const useAudioRecorder = (
  stream: MediaStream | null,
  config: AudioRecorderConfig = {}
) => {
  const {
    timeslice = AUDIO_CONFIG.DEFAULT_TIMESLICE,
    onDataAvailable,
    onError,
  } = config;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const { needsFallback } = detectBrowserSupport();

  const startRecording = useCallback(async () => {
    if (!stream) {
      const error = 'No audio stream available';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null, isRecording: true }));

      if (!needsFallback) {
        // Modern browsers: Use MediaRecorder
        const mimeType = getSupportedMimeType();
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 16000,
        });

        mediaRecorderRef.current.ondataavailable = async (event) => {
          if (event.data.size > 0 && onDataAvailable) {
            const arrayBuffer = await event.data.arrayBuffer();
            onDataAvailable(arrayBuffer);
          }
        };

        mediaRecorderRef.current.onerror = (event) => {
          const error = `${ERROR_MESSAGES.MEDIA_RECORDER_ERROR}: ${(event as any).error?.message || 'Unknown'}`;
          setState(prev => ({ ...prev, error, isRecording: false }));
          onError?.(error);
        };

        mediaRecorderRef.current.start(timeslice);
      } else {
        // Safari fallback: Use Web Audio API
        audioContextRef.current = createAudioContext(AUDIO_CONFIG.DEFAULT_SAMPLE_RATE);
        const source = audioContextRef.current.createMediaStreamSource(stream);
        
        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        processorRef.current.onaudioprocess = (event) => {
          if (state.isRecording && onDataAvailable) {
            const pcm16Data = convertToPCM16(event.inputBuffer);
            onDataAvailable(pcm16Data);
          }
        };

        source.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setState(prev => ({ ...prev, error: errorMessage, isRecording: false }));
      onError?.(errorMessage);
    }
  }, [stream, timeslice, onDataAvailable, onError, needsFallback, state.isRecording]);

  const stopRecording = useCallback(() => {
    setState(prev => ({ ...prev, isRecording: false }));

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cleanup,
  };
};