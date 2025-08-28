import { useCallback, useRef, useState } from 'react';

import { OpenAIVoice } from '@/services/voice/types';

export function useTTS() {
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, opts?: { voice?: OpenAIVoice }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: opts?.voice ?? 'alloy' }),
      });

      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      await audioRef.current.play();
    } finally {
      setLoading(false);
    }
  }, []);

  return { speak, loading };
}
