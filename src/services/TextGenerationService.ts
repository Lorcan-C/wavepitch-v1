import { generateText, streamText } from 'ai';

import { DEFAULT_TEXT_MODEL } from '../lib/ai';

export interface TextGenerationService {
  generateAgentResponse(prompt: string): Promise<string>;
  streamAgentResponse(prompt: string): Promise<ReadableStream>;
}

export class OpenAITextGenerationService implements TextGenerationService {
  async generateAgentResponse(prompt: string): Promise<string> {
    try {
      const result = await generateText({
        model: DEFAULT_TEXT_MODEL,
        prompt,
        temperature: 0.7,
      });

      return result.text;
    } catch (error) {
      console.error('OpenAI text generation failed:', error);
      throw error;
    }
  }

  async streamAgentResponse(prompt: string): Promise<ReadableStream> {
    try {
      const result = await streamText({
        model: DEFAULT_TEXT_MODEL,
        prompt,
        temperature: 0.7,
        onError: ({ error }) => console.error('Stream error:', error),
      });

      return result.textStream;
    } catch (error) {
      console.error('OpenAI text streaming failed:', error);
      throw error;
    }
  }
}

let textGenerationService: TextGenerationService | null = null;

export function getTextGenerationService(): TextGenerationService | null {
  if (!textGenerationService) {
    textGenerationService = new OpenAITextGenerationService();
  }
  return textGenerationService;
}

export function setTextGenerationService(service: TextGenerationService): void {
  textGenerationService = service;
}
