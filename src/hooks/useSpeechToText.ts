import { useState, useCallback, useRef, useEffect } from 'react';
import { useRealtimeTranscription } from '@speechmatics/real-time-client-react';
import { usePCMAudioRecorder, usePCMAudioListener } from '@speechmatics/browser-audio-input-react';

interface SpeechState {
  isListening: boolean;
  isConnecting: boolean;
  error: string | null;
  finalText: string;
  partialText: string;
}

export const useSpeechToText = () => {
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    isConnecting: false,
    error: null,
    finalText: '',
    partialText: ''
  });

  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(true);

  const { startTranscription, stopTranscription, sendAudio } = useRealtimeTranscription();
  const { startRecording, stopRecording } = usePCMAudioRecorder(
    "/js/pcm-audio-worklet.min.js",
    new AudioContext()
  );

  // Auto-send audio to Speechmatics
  usePCMAudioListener(sendAudio);

  // Fetch JWT with error handling
  const fetchJWT = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('https://wavepitch-v1.lorcanclarke.workers.dev/api/speechmatics/token', { method: 'POST' });
      if (response.status === 404) {
        throw new Error('Speechmatics endpoint not configured. Please set up the Cloudflare Worker.');
      }
      if (!response.ok) throw new Error(`Auth failed: ${response.status}`);
      const { jwt } = await response.json();
      return jwt;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw error;
      }
      throw new Error('Failed to connect to Speechmatics');
    }
  }, []);

  // Exponential backoff reconnection
  const reconnect = useCallback(async () => {
    if (retryCount >= 3) return;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    setTimeout(async () => {
      if (isMountedRef.current) {
        setRetryCount(prev => prev + 1);
        startListening();
      }
    }, delay);
  }, [retryCount]);

  const startListening = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // First request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Always fetch real JWT token from Cloudflare Worker
      const jwt = await fetchJWT();

      await startTranscription(jwt, {
        transcription_config: {
          language: 'en',
          enable_partials: true,
          max_delay: 2.0
        }
      });
      await startRecording({
        recordingOptions: {
          sampleRate: 16000
        }
      });

      setState(prev => ({ ...prev, isListening: true, isConnecting: false }));
      setRetryCount(0);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Recognition failed';
      setState(prev => ({
        ...prev,
        isListening: false,
        isConnecting: false,
        error: getUserFriendlyError(errorMsg)
      }));

      // Don't retry if it's a permission error
      if (!errorMsg.includes('NotAllowedError') && retryCount < 3) {
        reconnect();
      }
    }
  }, [startTranscription, startRecording, fetchJWT, reconnect, retryCount]);

  const stopListening = useCallback(async () => {
    await stopRecording();
    await stopTranscription();
    setState(prev => ({ ...prev, isListening: false, isConnecting: false }));
    setRetryCount(0);
  }, [stopRecording, stopTranscription]);

  const toggleListening = useCallback(() => {
    if (state.isListening || state.isConnecting) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, state.isConnecting, startListening, stopListening]);

  // Handle transcription events
  useEffect(() => {
    const handleTranscription = (event: any) => {
      if (!isMountedRef.current) return;

      const transcript = event.detail?.transcript || '';
      const isFinal = event.detail?.is_final || false;

      setState(prev => {
        if (isFinal) {
          return {
            ...prev,
            finalText: prev.finalText + transcript + ' ',
            partialText: ''
          };
        } else {
          return { ...prev, partialText: transcript };
        }
      });
    };

    window.addEventListener('speechmatics:transcription' as any, handleTranscription);
    return () => window.removeEventListener('speechmatics:transcription' as any, handleTranscription);
  }, []);

  // Cleanup on unmount/page unload
  useEffect(() => {
    const cleanup = () => stopListening();
    window.addEventListener('beforeunload', cleanup);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [stopListening]);

  return {
    ...state,
    displayText: state.finalText + state.partialText,
    toggleListening,
    clearTranscript: () => setState(prev => ({ ...prev, finalText: '', partialText: '' }))
  };
};

function getUserFriendlyError(error: string): string {
  if (error.includes('NotAllowedError')) return 'Microphone access denied. Please allow microphone access.';
  if (error.includes('4001')) return 'Microphone access denied';
  if (error.includes('4005')) return 'Too many users, try again';
  if (error.includes('404') || error.includes('endpoint not configured')) {
    return 'Speech service not configured. Please contact support.';
  }
  if (error.includes('Auth failed')) return 'Authentication failed';
  return 'Speech recognition unavailable';
}