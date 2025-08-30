import { getLangfusePrompt } from '../lib/langfuse';

export class PromptCacheService {
  private static readonly PROMPTS_TO_PREFETCH = [
    'pitch-context-analysis',
    'enhanced-meeting-setup',
    'meeting-summary-generation',
    'extract-meeting-purpose',
    'generate-meeting-details',
    'in-meeting-response',
    'speaker-transition',
  ] as const;

  static async preFetchPrompts(): Promise<void> {
    try {
      console.log('Pre-fetching prompts...');

      await Promise.allSettled(
        this.PROMPTS_TO_PREFETCH.map(async (promptName) => {
          try {
            await getLangfusePrompt(promptName);
          } catch (error) {
            console.warn(`Failed to pre-fetch prompt "${promptName}":`, error);
          }
        }),
      );

      console.log('Prompt pre-fetching completed');
    } catch (error) {
      console.error('Error during prompt pre-fetching:', error);
    }
  }
}
