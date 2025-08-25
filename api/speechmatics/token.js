import { createSpeechmaticsJWT } from '@speechmatics/auth';

// Specify Edge Runtime
export const config = {
  runtime: 'edge',
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Get API key from environment variables
    const apiKey = process.env.SPEECHMATICS_API_KEY;

    if (!apiKey) {
      console.error('SPEECHMATICS_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({
          error: 'Speechmatics API key not configured',
          detail: 'Please set SPEECHMATICS_API_KEY in Vercel environment variables',
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    // Create JWT with 15 minute TTL for better UX
    const jwt = createSpeechmaticsJWT({
      type: 'rt', // real-time
      apiKey: apiKey,
      ttl: 900, // 15 minutes
      client_ref: crypto.randomUUID(), // Secure random client reference
    });

    // Return JWT token
    return new Response(
      JSON.stringify({
        jwt,
        expires_in: 900,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('JWT generation failed:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate authentication token',
        detail: error.message || 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
