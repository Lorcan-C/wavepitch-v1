import { useCallback, useEffect, useRef, useState } from 'react';

import { RealtimeClient } from '@speechmatics/real-time-client';

export interface SpeechToTextConfig {
  language?: string;
  operatingPoint?: string;
  enablePartials?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useSpeechToText = (config: SpeechToTextConfig = {}) => {
  const {
    language = 'en',
    operatingPoint = 'enhanced',
    enablePartials = true,
    onTranscript,
    onError,
    onConnectionChange,
  } = config;

  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<RealtimeClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Fetch JWT token from our endpoint
  const fetchJwtToken = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/speechmatics-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.jwt) {
        return data.jwt;
      } else {
        throw new Error(data.error || 'Failed to get JWT token');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token fetch failed';
      setError(errorMessage);
      onError?.(errorMessage);
      throw error;
    }
  }, [onError]);

  // Handle connection state changes
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      setError(null);

      // Get JWT token
      const jwt = await fetchJwtToken();

      // Create RealtimeClient
      clientRef.current = new RealtimeClient();

      // Set up event listeners using the receiveMessage event
      clientRef.current.addEventListener(
        'receiveMessage',
        (event: {
          data: { message: string; results?: unknown[]; error?: { message: string } };
        }) => {
          const { data } = event;

          if (data.message === 'AddPartialTranscript') {
            const text =
              (data.results as { alternatives?: { content?: string }[] }[] | undefined)
                ?.map((result) => result.alternatives?.[0]?.content || '')
                .join('') || '';

            setCurrentTranscript(finalTranscript + text);
            onTranscript?.(text, false);
          } else if (data.message === 'AddTranscript') {
            const text =
              (data.results as { alternatives?: { content?: string }[] }[] | undefined)
                ?.map((result) => result.alternatives?.[0]?.content || '')
                .join('') || '';

            setFinalTranscript((prev) => prev + text);
            setCurrentTranscript((prev) => prev + text);
            onTranscript?.(text, true);
          } else if (data.message === 'Error') {
            const errorMessage = data.error?.message || 'Transcription error';
            setError(errorMessage);
            onError?.(errorMessage);
          }
        },
      );

      // Start transcription
      await clientRef.current.start(jwt, {
        transcription_config: {
          language,
          operating_point: operatingPoint as 'standard' | 'enhanced',
          enable_partials: enablePartials,
          max_delay: 1.0,
        },
      });

      setIsConnected(true);

      // Start microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Use MediaRecorder for audio chunks
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000,
      });

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && clientRef.current) {
          const arrayBuffer = await event.data.arrayBuffer();
          clientRef.current.sendAudio(arrayBuffer);
        }
      };

      mediaRecorderRef.current.start(100); // 100ms chunks
    } catch (error) {
      setIsRecording(false);
      setIsConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [
    fetchJwtToken,
    language,
    operatingPoint,
    enablePartials,
    finalTranscript,
    onTranscript,
    onError,
  ]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsConnected(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.stopRecognition();
      clientRef.current = null;
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setCurrentTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    // State
    isRecording,
    isConnected,
    isConnecting: false, // Simplified for now
    currentTranscript,
    finalTranscript,
    audioLevel: 0, // Simplified for now
    isVoiceActive: isRecording, // Simplified for now
    error,

    // Actions
    startRecording,
    stopRecording,
    resetTranscript,
  };
};
