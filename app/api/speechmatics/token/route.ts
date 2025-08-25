import { createSpeechmaticsJWT } from '@speechmatics/auth';

export const runtime = 'edge';

export async function POST() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const apiKey = process.env.SPEECHMATICS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const jwt = createSpeechmaticsJWT({
      type: 'rt',
      apiKey: apiKey,
      ttl: 60,
      clientRef: `wavepitch_${Date.now()}`,
    });

    return new Response(JSON.stringify({ jwt, expires_in: 60 }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('JWT generation failed:', error);
    return new Response(JSON.stringify({ error: 'JWT generation failed' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
