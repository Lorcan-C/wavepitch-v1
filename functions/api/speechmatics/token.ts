import { createSpeechmaticsJWT } from '@speechmatics/auth';

interface CloudflareContext {
  env: {
    SPEECHMATICS_API_KEY?: string;
  };
}

export async function onRequestPost(context: CloudflareContext) {
  try {
    // Get API key from environment variables
    const apiKey = context.env.SPEECHMATICS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Speechmatics API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create JWT with 60 second TTL for security
    const jwt = createSpeechmaticsJWT({
      type: 'rt', // real-time
      apiKey,
      ttl: 60, // 60 seconds
      client_ref: `wavepitch_${Date.now()}`, // Unique client reference
    });

    return new Response(
      JSON.stringify({
        jwt,
        expires_in: 60,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('JWT generation failed:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate authentication token',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
