import { Message } from '@/meetings/types';
import { OpenAIVoice } from '@/services/voice/types';
import { voiceAssigner } from '@/services/voice/voiceAssigner';

export class MessageTTSGenerator {
  private generatingAudio = new Map<string, Promise<Blob>>();

  async generateAudioBlob(
    message: Message,
    meetingId: string,
    participants: Array<{ id: string; name: string }>,
  ): Promise<Blob> {
    const cacheKey = message.id;

    // Return existing generation if in progress
    const existing = this.generatingAudio.get(cacheKey);
    if (existing) return existing;

    // Start new generation
    const generation = this.generate(message, meetingId, participants);
    this.generatingAudio.set(cacheKey, generation);

    try {
      return await generation;
    } finally {
      this.generatingAudio.delete(cacheKey);
    }
  }

  private async generate(
    message: Message,
    meetingId: string,
    participants: Array<{ id: string; name: string }>,
  ): Promise<Blob> {
    const voice = this.selectVoice(message, meetingId, participants);

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message.content,
        voice,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'audio/mpeg' });
  }

  private selectVoice(
    message: Message,
    meetingId: string,
    participants: Array<{ id: string; name: string }>,
  ): OpenAIVoice {
    const participant = participants.find((p) => p.id === message.sender);

    if (participant) {
      return voiceAssigner.getVoice(meetingId, message.sender);
    }

    // System or meeting-chair messages
    return 'nova';
  }
}
