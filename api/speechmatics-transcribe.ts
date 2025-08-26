import { createSpeechmaticsJWT } from '@speechmatics/auth';
import { RealtimeClient } from '@speechmatics/real-time-client';

export const config = {
  runtime: 'edge',
};

// Configuration constants
const CONFIG = {
  JWT_TTL: 300, // 5 minutes
  MAX_DELAY: 1.0,
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_OPERATING_POINT: 'enhanced',
  STREAM_TIMEOUT_MS: 300000, // 5 minutes
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
};

// TypeScript interfaces
interface TranscriptionResult {
  alternatives?: Array<{
    content?: string;
  }>;
  is_eos?: boolean;
  type?: string;
}

interface TranscriptionRequest {
  streamURL: string;
  language?: string;
  operatingPoint?: string;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }

  if (limit.count >= 10) {
    // Max 10 requests per minute
    return false;
  }

  limit.count++;
  return true;
}

function validateStreamURL(streamURL: string): void {
  try {
    const url = new URL(streamURL);
    const allowedProtocols = ['http:', 'https:'];

    if (!allowedProtocols.includes(url.protocol)) {
      throw new Error('Invalid stream URL protocol');
    }

    // Block internal/private networks for security
    const hostname = url.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    const privateRanges = [/^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./];

    if (blockedHosts.includes(hostname) || privateRanges.some((range) => range.test(hostname))) {
      throw new Error('Access to private networks not allowed');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid stream URL format');
    }
    throw error;
  }
}

function extractTextFromResults(results: TranscriptionResult[]): string {
  return results
    .flatMap((result) => result.alternatives || [])
    .map((alt) => alt.content || '')
    .join('');
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Rate limiting
  const clientIP =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(clientIP)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > CONFIG.MAX_REQUEST_SIZE) {
    return new Response(JSON.stringify({ error: 'Request too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: TranscriptionRequest = await request.json();
    const {
      streamURL,
      language = CONFIG.DEFAULT_LANGUAGE,
      operatingPoint = CONFIG.DEFAULT_OPERATING_POINT,
    } = body;

    if (!streamURL) {
      return new Response(JSON.stringify({ error: 'Stream URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate stream URL
    validateStreamURL(streamURL);

    const apiKey = process.env.SPEECHMATICS_API_KEY;
    if (!apiKey) {
      console.error('SPEECHMATICS_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Transcription service unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        transcribeStream(controller, apiKey, streamURL, language, operatingPoint).catch((error) => {
          console.error('Transcription error:', error);
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'Transcription service error occurred',
            })}\n\n`,
          );
          controller.close();
        });
      },
    });

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = request.headers.get('origin') || '';
    const corsOrigin =
      allowedOrigins.includes('*') || allowedOrigins.includes(origin)
        ? allowedOrigins.includes('*')
          ? '*'
          : origin
        : 'null';

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Request processing error:', error);
    const message =
      error instanceof Error && error.message.includes('URL')
        ? error.message
        : 'Invalid request data';

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function transcribeStream(
  controller: ReadableStreamDefaultController,
  apiKey: string,
  streamURL: string,
  language: string,
  operatingPoint: string,
) {
  let client: RealtimeClient | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let timeoutId: NodeJS.Timeout | null = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (client) {
      try {
        client.removeAllEventListeners?.();
        client.stopRecognition();
      } catch (error) {
        console.error('Client cleanup error:', error);
      }
    }

    if (reader) {
      try {
        reader.cancel();
      } catch (error) {
        console.error('Reader cleanup error:', error);
      }
    }
  };

  try {
    client = new RealtimeClient();

    // Set up timeout
    timeoutId = setTimeout(() => {
      controller.enqueue(
        `data: ${JSON.stringify({
          type: 'timeout',
          message: 'Stream timeout reached',
        })}\n\n`,
      );
      cleanup();
      controller.close();
    }, CONFIG.STREAM_TIMEOUT_MS);

    // Set up event listeners for transcription results
    client.addEventListener('receiveMessage', ({ data }) => {
      if (isCleanedUp) return;

      try {
        if (data.message === 'AddPartialTranscript') {
          const transcriptText = extractTextFromResults(data.results || []);

          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'partial',
              text: transcriptText,
              results: data.results,
              timestamp: Date.now(),
            })}\n\n`,
          );
        } else if (data.message === 'AddTranscript') {
          const transcriptText = extractTextFromResults(data.results || []);

          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'final',
              text: transcriptText,
              results: data.results,
              is_final: data.results?.some((r: TranscriptionResult) => r.is_eos) || false,
              timestamp: Date.now(),
            })}\n\n`,
          );
        } else if (data.message === 'EndOfTranscript') {
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'end',
            })}\n\n`,
          );
          cleanup();
          controller.close();
        } else if (data.message === 'Error') {
          const errorMessage =
            data.error?.message || data.message || 'Transcription error occurred';
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'error',
              message: errorMessage,
            })}\n\n`,
          );
          cleanup();
          controller.close();
        }
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });

    // Create JWT for authentication
    const jwt = await createSpeechmaticsJWT({
      type: 'rt',
      apiKey,
      ttl: CONFIG.JWT_TTL,
    });

    // Start the real-time transcription session with partials enabled
    await client.start(jwt, {
      transcription_config: {
        language,
        operating_point: operatingPoint,
        enable_partials: true,
        max_delay: CONFIG.MAX_DELAY,
        transcript_filtering_config: {
          remove_disfluencies: true,
        },
      },
    });

    // Send initial connection success message
    controller.enqueue(
      `data: ${JSON.stringify({
        type: 'connected',
      })}\n\n`,
    );

    // Fetch and stream audio data to Speechmatics
    const audioResponse = await fetch(streamURL, {
      headers: {
        'User-Agent': 'Speechmatics-Transcriber/1.0',
      },
    });

    if (!audioResponse.ok) {
      throw new Error(`Audio stream returned ${audioResponse.status}`);
    }

    if (!audioResponse.body) {
      throw new Error('No audio stream available');
    }

    reader = audioResponse.body.getReader();

    // Process audio stream chunks
    while (!isCleanedUp) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('Audio stream ended normally');
        client.stopRecognition({ noTimeout: true });
        break;
      }

      if (value && !isCleanedUp) {
        client.sendAudio(value);
      }
    }
  } catch (error) {
    console.error('Audio streaming error:', error);

    if (!isCleanedUp) {
      const errorMessage =
        error instanceof Error && error.message.includes('fetch')
          ? 'Unable to connect to audio stream'
          : 'Audio processing error occurred';

      controller.enqueue(
        `data: ${JSON.stringify({
          type: 'error',
          message: errorMessage,
        })}\n\n`,
      );
    }
  } finally {
    cleanup();
    if (!isCleanedUp) {
      controller.close();
    }
  }
}
