import { Message, Participant } from '@/meetings/types';

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer';

export class TTSVoiceSelectionService {
  private static voicePool: OpenAIVoice[] = ['alloy', 'echo', 'fable', 'nova', 'onyx', 'shimmer'];
  private static participantVoices = new Map<string, OpenAIVoice>();

  static assignVoices(participants: Participant[]): void {
    const aiParticipants = participants.filter((p) => !p.isUser);

    aiParticipants.forEach((participant, index) => {
      if (!this.participantVoices.has(participant.id)) {
        const voice = this.voicePool[index % this.voicePool.length];
        this.participantVoices.set(participant.id, voice);
        console.log(`TTS Voice: Assigned ${voice} to ${participant.name} (${participant.id})`);
      }
    });
  }

  static getVoiceForMessage(message: Message): OpenAIVoice | null {
    if (message.isUser) {
      return null;
    }

    return this.participantVoices.get(message.sender) || 'alloy';
  }
}
