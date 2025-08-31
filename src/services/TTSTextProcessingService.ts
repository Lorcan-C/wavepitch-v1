import { Message } from '@/meetings/types';

import { TTSAudioCacheService } from './TTSAudioCacheService';
import { TTSVoiceSelectionService } from './TTSVoiceSelectionService';

export class TTSTextProcessingService {
  static async processMessageForTTS(message: Message): Promise<string | null> {
    try {
      const voice = TTSVoiceSelectionService.getVoiceForMessage(message);

      if (!voice) {
        console.log(`TTS: Skipping TTS for user message ${message.id}`);
        return null;
      }

      const response = await fetch('/api/ai/generatespeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
          voice: voice,
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
