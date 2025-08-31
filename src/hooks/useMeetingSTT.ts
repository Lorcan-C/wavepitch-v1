import { useCallback, useEffect, useState } from 'react';

import { usePCMAudioListener, usePCMAudioRecorder } from '@speechmatics/browser-audio-input-react';
import type { OperatingPoint } from '@speechmatics/real-time-client';
import {
  useRealtimeEventListener,
  useRealtimeTranscription,
} from '@speechmatics/real-time-client-react';

export interface MeetingSTTConfig {
  language?: string;
  operatingPoint?: OperatingPoint;
  enablePartials?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export const useMeetingSTT = (config: MeetingSTTConfig = {}) => {
  const {
    language = 'en',
    operatingPoint = 'enhanced',
    enablePartials = true,
    onTranscript,
    onError,
  } = config;

  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Speechmatics React hooks
  const { startTranscription, stopTranscription, sendAudio, socketState } =
    useRealtimeTranscription();
  const { isRecording, startRecording, stopRecording } = usePCMAudioRecorder(
    '/js/pcm-audio-worklet.min.js',
    typeof window !== 'undefined' ? new AudioContext() : undefined,
  );

  // Send audio to Speechmatics when captured
  usePCMAudioListener(sendAudio);

  // Listen for transcript events using receiveMessage pattern like the working legacy hook
  useRealtimeEventListener('receiveMessage', (event) => {
    const { data } = event;

    if (data.message === 'AddPartialTranscript' && enablePartials) {
      const text =
        (data.results as { alternatives?: { content?: string }[] }[] | undefined)
          ?.map((result) => result.alternatives?.[0]?.content || '')
          .join(' ') || '';

      setCurrentTranscript(text);
      onTranscript?.(text, false);
    } else if (data.message === 'AddTranscript') {
      const text =
        (data.results as { alternatives?: { content?: string }[] }[] | undefined)
          ?.map((result) => result.alternatives?.[0]?.content || '')
          .join(' ') || '';

      setFinalTranscript((prev) => prev + (prev ? ' ' : '') + text);
      setCurrentTranscript(''); // Clear partial when final arrives
      onTranscript?.(text, true);
    } else if (data.message === 'Error') {
      const errorMsg = 'Transcription error';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  });

  // Fetch JWT from existing endpoint
  const fetchJWT = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/speechmatics-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`JWT request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.jwt) {
        return data.jwt;
      } else {
        throw new Error(data.error || 'Failed to get JWT token');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMsg);
      onError?.(errorMsg);
      throw error;
    }
  }, [onError]);

  const startSession = useCallback(async () => {
    try {
      setError(null);
      setIsTranscribing(true);

      // Get JWT token
      const jwt = await fetchJWT();

      // Start Speechmatics transcription session
      await startTranscription(jwt, {
        transcription_config: {
          language,
          operating_point: operatingPoint,
          enable_partials: enablePartials,
          max_delay: 1.0,
        },
      });

      // Start audio recording
      await startRecording({});
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start transcription';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsTranscribing(false);
    }
  }, [
    startTranscription,
    startRecording,
    fetchJWT,
    language,
    operatingPoint,
    enablePartials,
    onError,
  ]);

  const stopSession = useCallback(async () => {
    try {
      await stopRecording();
      await stopTranscription();
    } catch (error) {
      console.error('Error stopping STT session:', error);
    } finally {
      setIsTranscribing(false);
    }
  }, [stopRecording, stopTranscription]);

  const resetTranscript = useCallback(() => {
    setCurrentTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTranscribing) {
        stopSession();
      }
    };
  }, [isTranscribing, stopSession]);

  return {
    // State
    isRecording,
    isTranscribing,
    isConnected: socketState === 'open',
    currentTranscript,
    finalTranscript,
    error,

    // Actions
    startSession,
    stopSession,
    resetTranscript,
  };
};
