import { OpenAIVoice } from './types';

export class SessionStore {
  private sessions = new Map<string, Map<string, OpenAIVoice>>();

  getVoice(sessionId: string, participantId: string): OpenAIVoice | undefined {
    return this.sessions.get(sessionId)?.get(participantId);
  }

  setVoice(sessionId: string, participantId: string, voice: OpenAIVoice): void {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Map());
    }
    this.sessions.get(sessionId)!.set(participantId, voice);
  }

  getSession(sessionId: string): Map<string, OpenAIVoice> {
    return this.sessions.get(sessionId) || new Map();
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}
