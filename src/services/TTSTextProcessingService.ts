import { Message } from '@/meetings/types';

import { TTSAudioCacheService } from './TTSAudioCacheService';

export class TTSTextProcessingService {
  static async processMessageForTTS(message: Message): Promise<string | null> {
    try {
      const response = await fetch('/api/ai/generatespeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      TTSAudioCacheService.storeAudioForMessage(message.id, audioUrl);
      console.log(`TTS: Generated audio for message ${message.id}`);

      return audioUrl;
    } catch (error) {
      console.error(`TTS processing failed for message ${message.id}:`, error);
      return null;
    }
  }
}
