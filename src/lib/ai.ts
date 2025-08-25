import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// Provider switcher - change this line to switch providers
const model = openai('gpt-4');

/**
 * Generate text using AI SDK Core
 */
export async function generateText(prompt: string): Promise<string> {
  const { text } = await generateText({
    model,
    prompt,
  });
  return text;
}

/**
 * Stream text using AI SDK Core
 */
export async function streamText(prompt: string) {
  const { textStream } = await streamText({
    model,
    prompt,
  });
  return textStream;
}