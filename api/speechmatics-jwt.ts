import { createSpeechmaticsJWT } from '@speechmatics/auth';

export const config = {
  runtime: 'edge',
};

// Configuration constants
const CONFIG = {
  JWT_TTL: 300, // 5 minutes (as recommended by research)
  RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
} as const;

// Simple rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + CONFIG.RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= CONFIG.RATE_LIMIT_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
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

  try {
    const apiKey = process.env.SPEECHMATICS_API_KEY;
    if (!apiKey) {
      console.error('SPEECHMATICS_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create JWT token for real-time transcription
    const jwt = await createSpeechmaticsJWT({
      type: 'rt', // real-time
      apiKey,
      ttl: CONFIG.JWT_TTL,
    });

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = request.headers.get('origin') || '';
    const corsOrigin =
      allowedOrigins.includes('*') || allowedOrigins.includes(origin)
        ? allowedOrigins.includes('*')
          ? '*'
          : origin
        : 'null';

    return new Response(
      JSON.stringify({
        success: true,
        jwt,
        expiresIn: CONFIG.JWT_TTL,
        websocketUrl: 'wss://eu2.rt.speechmatics.com/v2/',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('JWT generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}