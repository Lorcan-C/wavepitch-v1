import { useCallback, useEffect, useState } from 'react';
import { useRealtimeClient } from '@speechmatics/real-time-client-react';
import { useBrowserAudioInput } from '@speechmatics/browser-audio-input';

export interface SpeechToTextConfig {
  language?: string;
  operatingPoint?: string;
  enablePartials?: boolean;
  autoStart?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useSpeechToText = (config: SpeechToTextConfig = {}) => {
  const {
    language = 'en',
    operatingPoint = 'enhanced',
    enablePartials = true,
    autoStart = false,
    onTranscript,
    onError,
    onConnectionChange,
  } = config;

  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  // Official Speechmatics React hooks
  const realtimeClient = useRealtimeClient({
    jwt: jwtToken,
    websocketUrl: 'wss://eu2.rt.speechmatics.com/v2/',
    transcriptionConfig: {
      language,
      operating_point: operatingPoint,
      enable_partials: enablePartials,
      max_delay: 1.0,
    },
  });

  const audioInput = useBrowserAudioInput({
    client: realtimeClient.client,
    sampleRate: 16000,
    enableAudioLevelCallback: true,
  });

  // Fetch JWT token from our endpoint
  const fetchJwtToken = useCallback(async () => {
    try {
      const response = await fetch('/api/speechmatics-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.jwt) {
        setJwtToken(data.jwt);
        return data.jwt;
      } else {
        throw new Error(data.error || 'Failed to get JWT token');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token fetch failed';
      onError?.(errorMessage);
      throw error;
    }
  }, [onError]);

  // Handle transcript updates from Speechmatics
  useEffect(() => {
    if (!realtimeClient.client) return;

    const handlePartialTranscript = (transcript: any) => {
      const text = transcript.results
        ?.map((result: any) => result.alternatives?.[0]?.content || '')
        .join('') || '';
      
      setCurrentTranscript(finalTranscript + text);
      onTranscript?.(text, false);
    };

    const handleFinalTranscript = (transcript: any) => {
      const text = transcript.results
        ?.map((result: any) => result.alternatives?.[0]?.content || '')
        .join('') || '';
      
      setFinalTranscript(prev => prev + text);
      setCurrentTranscript(prev => prev + text);
      onTranscript?.(text, true);
    };

    const handleError = (error: any) => {
      const errorMessage = error?.error?.message || error?.message || 'Transcription error';
      onError?.(errorMessage);
    };

    // Subscribe to Speechmatics events
    realtimeClient.client.addEventListener('AddPartialTranscript', handlePartialTranscript);
    realtimeClient.client.addEventListener('AddTranscript', handleFinalTranscript);
    realtimeClient.client.addEventListener('Error', handleError);

    return () => {
      realtimeClient.client.removeEventListener('AddPartialTranscript', handlePartialTranscript);
      realtimeClient.client.removeEventListener('AddTranscript', handleFinalTranscript);
      realtimeClient.client.removeEventListener('Error', handleError);
    };
  }, [realtimeClient.client, finalTranscript, onTranscript, onError]);

  // Handle connection state changes
  useEffect(() => {
    onConnectionChange?.(realtimeClient.connectionState === 'connected');
  }, [realtimeClient.connectionState, onConnectionChange]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && !jwtToken) {
      fetchJwtToken();
    }
  }, [autoStart, jwtToken, fetchJwtToken]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      
      // Get JWT token if we don't have one
      if (!jwtToken) {
        await fetchJwtToken();
      }

      // Start audio input (this will connect and start streaming)
      await audioInput.start();
      
    } catch (error) {
      setIsRecording(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      onError?.(errorMessage);
    }
  }, [jwtToken, fetchJwtToken, audioInput.start, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    audioInput.stop();
  }, [audioInput.stop]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setCurrentTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    // State
    isRecording,
    isConnected: realtimeClient.connectionState === 'connected',
    isConnecting: realtimeClient.connectionState === 'connecting',
    currentTranscript,
    finalTranscript,
    audioLevel: audioInput.audioLevel || 0,
    isVoiceActive: (audioInput.audioLevel || 0) > 0.1,
    error: realtimeClient.error,

    // Actions
    startRecording,
    stopRecording,
    resetTranscript,
  };
};