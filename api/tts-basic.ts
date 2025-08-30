import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'nodejs18.x',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Kill switch - can be disabled via environment variable
  const TTS_ENABLED = process.env.TTS_ENABLED !== 'false';
  if (!TTS_ENABLED) {
    return res.status(503).json({ error: 'TTS service is currently disabled' });
  }

  try {
    const { text, voice = 'nova', format = 'mp3', speed = 1.0 } = req.body;

    // Input validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (text.length > 4000) {
      return res.status(400).json({ error: 'Text must be 4000 characters or less' });
    }

    // Clamp speed to OpenAI's allowed range
    const clampedSpeed = Math.max(0.5, Math.min(2.0, Number(speed) || 1.0));

    const validVoices = ['alloy', 'echo', 'fable', 'nova', 'onyx', 'shimmer'];
    if (!validVoices.includes(voice)) {
      return res.status(400).json({ error: 'Invalid voice selection' });
    }

    const validFormats = ['mp3', 'opus', 'aac', 'flac'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Invalid format selection' });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Direct fetch to OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: format,
        speed: clampedSpeed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `OpenAI TTS API error: ${response.status}`,
      });
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    // Set appropriate MIME type headers
    const mimeTypes = {
      mp3: 'audio/mpeg',
      opus: 'audio/opus',
      aac: 'audio/aac',
      flac: 'audio/flac',
    };

    res.setHeader('Content-Type', mimeTypes[format as keyof typeof mimeTypes]);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return res.send(buffer);
  } catch (error) {
    console.error('TTS Basic API error:', error);
    return res.status(500).json({
      error: 'Internal server error processing TTS request',
    });
  }
}
