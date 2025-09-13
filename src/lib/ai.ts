import { openai } from '@ai-sdk/openai';
import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
  experimental_generateSpeech as generateSpeech,
} from 'ai';

// Model Configuration - Centralized model management
export const AI_MODELS = {
  // Text generation models
  TEXT: {
    GPT_4O: openai('gpt-4o'),
    GPT_4O_MINI: openai('gpt-4o-mini'),
    GPT_4: openai('gpt-4'),
    GPT_4_1_NANO: openai('gpt-4.1-nano'),
  },
  // Speech models
  SPEECH: {
    GPT_4O_MINI_TTS: openai.speech('gpt-4o-mini-tts'),
    TTS_1: openai.speech('tts-1'),
    TTS_1_HD: openai.speech('tts-1-hd'),
  },
} as const;

// Default model selection - using GPT-4.1 Nano for text
export const DEFAULT_TEXT_MODEL = AI_MODELS.TEXT.GPT_4_1_NANO;
export const DEFAULT_SPEECH_MODEL = AI_MODELS.SPEECH.GPT_4O_MINI_TTS;

// Legacy export for backward compatibility
const model = DEFAULT_TEXT_MODEL;

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
    onError: ({ error }) => console.error('AI stream error:', error),
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
      model: DEFAULT_SPEECH_MODEL,
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
