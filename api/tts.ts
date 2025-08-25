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

    if (!text || text.length > 5000) {
      return new Response('Missing or too-long text', { status: 400 });
    }

    const audio = await generateSpeech({
      model: openai.speech('tts-1', {
        apiKey: process.env.openai_api_key,
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
    return new Response(JSON.stringify({ error: 'Failed to generate speech' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
