import { useCallback, useRef, useState } from 'react';

import type { OpenAIVoice } from '../services/voice/types';

interface UseSimpleTTSOptions {
  voice?: OpenAIVoice;
  format?: 'mp3' | 'opus' | 'aac' | 'flac';
  speed?: number;
}

interface UseSimpleTTSReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  error: string | null;
}

export function useSimpleTTS(options: UseSimpleTTSOptions = {}): UseSimpleTTSReturn {
  const { voice = 'nova', format = 'mp3', speed = 1.0 } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    // Stop HTML Audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Stop Speech Synthesis
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel();
      speechSynthesisRef.current = null;
    }

    // Clean up audio URL
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }

    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setError('Text cannot be empty');
        return;
      }

      // Stop any current playback
      stop();
      setError(null);
      setIsSpeaking(true);

      try {
        // Try OpenAI TTS API first
        const response = await fetch('/api/tts-basic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voice,
            format,
            speed,
          }),
        });

        if (!response.ok) {
          throw new Error(`TTS API failed: ${response.status}`);
        }

        // Create audio blob and play
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          if (currentAudioUrlRef.current) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
          }
        };

        audio.onerror = () => {
          setError('Audio playback failed');
          setIsSpeaking(false);
          if (currentAudioUrlRef.current) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
          }
        };

        await audio.play();
      } catch (apiError) {
        console.warn('OpenAI TTS failed, falling back to browser speech synthesis:', apiError);

        // Fallback to browser speechSynthesis
        try {
          if (!('speechSynthesis' in window)) {
            throw new Error('Speech synthesis not supported in this browser');
          }

          const utterance = new SpeechSynthesisUtterance(text);
          speechSynthesisRef.current = utterance;

          utterance.rate = speed;
          utterance.onend = () => {
            setIsSpeaking(false);
            speechSynthesisRef.current = null;
          };

          utterance.onerror = (event) => {
            setError(`Speech synthesis failed: ${event.error}`);
            setIsSpeaking(false);
            speechSynthesisRef.current = null;
          };

          speechSynthesis.speak(utterance);
        } catch (fallbackError) {
          setError(
            `TTS failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
          );
          setIsSpeaking(false);
        }
      }
    },
    [voice, format, speed, stop],
  );

  return {
    speak,
    stop,
    isSpeaking,
    error,
  };
}
