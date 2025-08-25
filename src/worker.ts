import { createSpeechmaticsJWT } from '@speechmatics/auth';

export interface Env {
  SPEECHMATICS_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/speechmatics/token' && request.method === 'POST') {
      try {
        if (!env.SPEECHMATICS_API_KEY) {
          return new Response(JSON.stringify({ error: 'API key not configured' }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        const jwt = createSpeechmaticsJWT({
          type: 'rt',
          apiKey: env.SPEECHMATICS_API_KEY,
          ttl: 60,
          clientRef: `wavepitch_${Date.now()}`,
        });

        return new Response(JSON.stringify({ jwt, expires_in: 60 }), {
          status: 200,
          headers: corsHeaders,
        });
      } catch {
        return new Response(JSON.stringify({ error: 'JWT generation failed' }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};
