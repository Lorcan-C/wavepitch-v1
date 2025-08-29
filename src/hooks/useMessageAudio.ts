import { useEffect, useRef, useState } from 'react';

import { Message } from '@/meetings/types';
import { messageAudioService } from '@/services/audio/MessageAudioService';

interface UseMessageAudioOptions {
  autoPlay?: boolean;
  enabled?: boolean;
}

export function useMessageAudio(
  messages: Message[],
  meetingId: string,
  participants: Array<{ id: string; name: string }>,
  options: UseMessageAudioOptions = {},
) {
  const { autoPlay = true, enabled = true } = options;
  const [messagesWithAudio, setMessagesWithAudio] = useState<Message[]>(messages);
  const [isPlaying, setIsPlaying] = useState(false);
  const playedMessageIds = useRef(new Set<string>());
  const audioQueue = useRef<HTMLAudioElement[]>([]);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Generate audio URLs for messages
  useEffect(() => {
    if (!enabled) return;

    const generateAudioUrls = async () => {
      const updatedMessages = await Promise.all(
        messages.map(async (message) => {
          // Skip if already has audio or is user message
          if (message.audioUrl || message.isUser) {
            return message;
          }

          const audioUrl = await messageAudioService.getAudioUrl(message, meetingId, participants);

          return audioUrl ? { ...message, audioUrl } : message;
        }),
      );

      setMessagesWithAudio(updatedMessages);
    };

    generateAudioUrls();
  }, [messages, meetingId, participants, enabled]);

  // Auto-play new messages
  useEffect(() => {
    if (!autoPlay || !enabled) return;

    const playNewMessages = async () => {
      const newAudioMessages = messagesWithAudio.filter(
        (msg) => msg.audioUrl && !msg.isUser && !playedMessageIds.current.has(msg.id),
      );

      if (newAudioMessages.length === 0) return;

      setIsPlaying(true);

      for (const message of newAudioMessages) {
        if (!message.audioUrl) continue;

        try {
          await playAudioMessage(message.audioUrl);
          playedMessageIds.current.add(message.id);
        } catch (error) {
          console.error(`Failed to play audio for message ${message.id}:`, error);
        }
      }

      setIsPlaying(false);
    };

    playNewMessages();
  }, [messagesWithAudio, autoPlay, enabled]);

  const playAudioMessage = (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);

      // iOS Safari compatibility
      audio.load();

      audio.addEventListener('ended', () => {
        currentAudio.current = null;
        resolve();
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        currentAudio.current = null;
        reject(e);
      });

      currentAudio.current = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Audio play failed:', error);
          reject(error);
        });
      }
    });
  };

  const stopAudio = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    audioQueue.current = [];
    setIsPlaying(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return {
    messagesWithAudio,
    isPlaying,
    stopAudio,
    playAudioMessage,
  };
}
