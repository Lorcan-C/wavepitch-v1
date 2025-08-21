export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    // Only handle our password endpoint
    const url = new URL(request.url);
    if (url.pathname !== '/api/validate-password' || request.method !== 'POST') {
      return new Response('{"error":"Not found"}', { status: 404, headers });
    }
    
    try {
      const { password } = await request.json();
      
      if (!password) {
        return new Response('{"isValid":false,"error":"Password required"}', { 
          status: 400, headers 
        });
      }
      
      // Call Supabase
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/validate_password`, {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_password: password })
      });
      
      const result = await response.json();
      return new Response(`{"isValid":${result === true}}`, { headers });
      
    } catch (e) {
      return new Response('{"isValid":false,"error":"Server error"}', { 
        status: 500, headers 
      });
    }
  }
};