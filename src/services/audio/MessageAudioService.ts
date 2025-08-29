import { Message } from '@/meetings/types';

import { AudioCacheManager } from './AudioCacheManager';
import { MessageTTSGenerator } from './MessageTTSGenerator';

export class MessageAudioService {
  private cacheManager: AudioCacheManager;
  private ttsGenerator: MessageTTSGenerator;

  constructor() {
    this.cacheManager = new AudioCacheManager();
    this.ttsGenerator = new MessageTTSGenerator();

    // Periodic cleanup every 5 minutes
    setInterval(
      () => {
        this.cacheManager.cleanupExpired();
      },
      5 * 60 * 1000,
    );
  }

  async getAudioUrl(
    message: Message,
    meetingId: string,
    participants: Array<{ id: string; name: string }>,
  ): Promise<string | null> {
    // Only generate audio for non-user messages
    if (message.isUser || !message.id) return null;

    // Check cache first
    const cachedUrl = this.cacheManager.get(message.id);
    if (cachedUrl) return cachedUrl;

    try {
      // Generate new audio
      const audioBlob = await this.ttsGenerator.generateAudioBlob(message, meetingId, participants);

      // Create blob URL and cache it
      const audioUrl = URL.createObjectURL(audioBlob);
      this.cacheManager.set(message.id, audioUrl);

      console.log(
        `Generated audio for message ${message.id} from ${message.senderName || 'System'}`,
      );
      return audioUrl;
    } catch (error) {
      console.error(`Failed to generate audio for message ${message.id}:`, error);
      return null;
    }
  }

  // Preload audio for multiple messages
  async preloadMessages(
    messages: Message[],
    meetingId: string,
    participants: Array<{ id: string; name: string }>,
  ): Promise<void> {
    const audioPromises = messages
      .filter((msg) => !msg.isUser)
      .map((msg) => this.getAudioUrl(msg, meetingId, participants));

    await Promise.allSettled(audioPromises);
  }

  cleanup(): void {
    this.cacheManager.clear();
  }

  getCacheSize(): number {
    return this.cacheManager.size;
  }
}

// Singleton instance
export const messageAudioService = new MessageAudioService();
