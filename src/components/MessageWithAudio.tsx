import { useEffect, useRef, useState } from 'react';

import { Volume2, VolumeX } from 'lucide-react';

import { Message } from '@/meetings/types';

interface MessageWithAudioProps {
  message: Message;
  className?: string;
}

export function MessageWithAudio({ message, className }: MessageWithAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!message.audioUrl) return;

    const audio = new Audio(message.audioUrl);
    audioRef.current = audio;

    // iOS Safari compatibility
    audio.load();

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => {
      setHasError(true);
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [message.audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Reset other playing audio first
      document.querySelectorAll('audio').forEach((audio) => {
        if (audio !== audioRef.current) audio.pause();
      });

      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setHasError(true);
      });
    }
  };

  const canPlayAudio = message.audioUrl && !message.isUser && !hasError;

  return (
    <div className={`flex items-start gap-2 ${className || ''}`}>
      <div className="flex-1">{message.content}</div>
      {canPlayAudio && (
        <button
          onClick={togglePlayback}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          title={isPlaying ? 'Pause' : 'Play audio'}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            <VolumeX className="w-4 h-4 text-gray-600" />
          ) : (
            <Volume2 className="w-4 h-4 text-gray-600" />
          )}
        </button>
      )}
    </div>
  );
}
