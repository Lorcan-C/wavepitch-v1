import { getLangfusePrompt } from '../lib/langfuse';

export class ServerPromptService {
  // Cache for Langfuse prompts to avoid repeated fetches
  private static promptCache = new Map<
    string,
    { compile: (data: Record<string, string>) => string } | null
  >();

  /**
   * Get cached Langfuse prompt (server-side only)
   */
  static async getLangfusePromptCached(name: string) {
    if (!this.promptCache.has(name)) {
      try {
        const prompt = await getLangfusePrompt(name);
        this.promptCache.set(name, prompt);
      } catch {
        this.promptCache.set(name, null);
      }
    }
    return this.promptCache.get(name);
  }

  /**
   * Pre-fetch multiple prompts for caching
   */
  static async preFetchPrompts(promptNames: string[]): Promise<void> {
    await Promise.allSettled(
      promptNames.map(async (promptName) => {
        try {
          await this.getLangfusePromptCached(promptName);
        } catch (error) {
          console.warn(`Failed to pre-fetch prompt "${promptName}":`, error);
        }
      }),
    );
  }

  /**
   * Clear the prompt cache
   */
  static clearCache(): void {
    this.promptCache.clear();
  }
}
