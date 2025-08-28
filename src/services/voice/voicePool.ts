import { OpenAIVoice } from './types';

export class VoicePool {
  private readonly voices: OpenAIVoice[] = ['alloy', 'echo', 'fable', 'nova', 'onyx', 'shimmer'];

  getVoice(index: number): OpenAIVoice {
    return this.voices[index % this.voices.length];
  }

  getDefault(): OpenAIVoice {
    return 'alloy';
  }
}
