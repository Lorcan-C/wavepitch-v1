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

      const response = await fetch('/api/prompts/prefetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptNames: this.PROMPTS_TO_PREFETCH,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pre-fetch prompts: ${response.status}`);
      }

      console.log('Prompt pre-fetching completed');
    } catch (error) {
      console.error('Error during prompt pre-fetching:', error);
    }
  }
}
