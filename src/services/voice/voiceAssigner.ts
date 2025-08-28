import { Participant } from '../../meetings/types';
import { SessionStore } from './sessionStore';
import { OpenAIVoice } from './types';
import { VoicePool } from './voicePool';

export class VoiceAssigner {
  private voicePool = new VoicePool();
  private sessionStore = new SessionStore();

  assignVoices(sessionId: string, participants: Participant[]): void {
    const aiParticipants = participants.filter((p) => !p.isUser);

    aiParticipants.forEach((participant, index) => {
      if (!this.sessionStore.getVoice(sessionId, participant.id)) {
        const voice = this.voicePool.getVoice(index);
        this.sessionStore.setVoice(sessionId, participant.id, voice);
      }
    });
  }

  getVoice(sessionId: string, participantId: string): OpenAIVoice {
    return this.sessionStore.getVoice(sessionId, participantId) || this.voicePool.getDefault();
  }

  clearSession(sessionId: string): void {
    this.sessionStore.deleteSession(sessionId);
  }
}

export const voiceAssigner = new VoiceAssigner();
