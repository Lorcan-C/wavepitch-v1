import { openai } from '@ai-sdk/openai';
import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
  experimental_generateSpeech as generateSpeech,
} from 'ai';

// Provider switcher - change this line to switch providers
const model = openai('gpt-4');

/**
 * Generate text using AI SDK Core
 */
export async function generateText(prompt: string): Promise<string> {
  const { text } = await aiGenerateText({
    model,
    prompt,
  });
  return text;
}

/**
 * Stream text using AI SDK Core
 */
export async function streamText(prompt: string) {
  const { textStream } = await aiStreamText({
    model,
    prompt,
  });
  return textStream;
}

/**
 * Generate speech using AI SDK Core - Following Vercel guidance
 */
export async function generateAISpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer' = 'nova',
): Promise<Uint8Array> {
  try {
    // Step 2: Basic implementation
    const audio = await generateSpeech({
      model: openai.speech('tts-1'),
      text,
      voice,
    });

    // Step 3: Access audio data as per Vercel docs
    // @ts-expect-error - audioData exists at runtime but types may be outdated
    return audio.audioData;
  } catch (error: unknown) {
    // Step 3: Error handling as per Vercel docs
    console.log('Speech generation error:', error);
    if (error instanceof Error) {
      throw new Error(`Speech generation failed: ${error.message}`);
    }
    throw new Error('Speech generation failed: Unknown error');
  }
}

/**
 * Helper function to play audio in browser - Step 4: Usage
 */
export function playAudioData(audioData: Uint8Array): void {
  const audioBlob = new Blob([new Uint8Array(audioData)], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audioElement = new Audio(audioUrl);
  audioElement.play();
}
