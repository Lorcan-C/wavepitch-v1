import { openai } from '@ai-sdk/openai';
import { experimental_generateSpeech as generateSpeech } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required for speech synthesis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Text too long - maximum 5000 characters allowed' }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'TTS service not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const audio = await generateSpeech({
      model: openai.speech('tts-1', {
        apiKey: process.env.OPENAI_API_KEY,
      }),
      text,
      voice,
    });

    // Return the audio data directly with appropriate headers
    return new Response(audio.audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS generation error:', error);

    let status = 500;
    let errorMessage = 'Failed to generate speech';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('rate limit') || message.includes('quota')) {
        status = 429;
        errorMessage = 'TTS service temporarily busy. Please try again shortly.';
      } else if (message.includes('invalid voice') || message.includes('voice not found')) {
        status = 400;
        errorMessage = 'Invalid voice selection. Please try a different voice.';
      } else if (message.includes('unauthorized') || message.includes('invalid api key')) {
        status = 401;
        errorMessage = 'TTS service authentication error.';
      } else if (message.includes('content filter') || message.includes('safety')) {
        status = 422;
        errorMessage = 'Text content not suitable for speech synthesis.';
      } else if (message.includes('timeout')) {
        status = 408;
        errorMessage = 'Speech generation timeout. Please try again.';
      } else if (message.includes('network') || message.includes('fetch')) {
        status = 503;
        errorMessage = 'Network error during speech generation.';
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        ...(status === 500 && error instanceof Error && { debug: error.message }),
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
