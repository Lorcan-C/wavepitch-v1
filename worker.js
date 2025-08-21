export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    const url = new URL(request.url);
    
    // Route: Get Clerk publishable key
    if (url.pathname === '/api/clerk/config' && request.method === 'GET') {
      return new Response(JSON.stringify({
        publishableKey: env.CLERK_PUBLISHABLE_KEY
      }), { headers });
    }
    
    // Route: Verify Clerk session (backend verification)
    if (url.pathname === '/api/clerk/verify-session' && request.method === 'POST') {
      try {
        const { sessionToken } = await request.json();
        
        if (!sessionToken) {
          return new Response('{"valid":false,"error":"Session token required"}', { 
            status: 400, headers 
          });
        }
        
        // Verify the session with Clerk's Backend API
        const clerkResponse = await fetch(`https://api.clerk.com/v1/sessions/${sessionToken}/verify`, {
          headers: {
            'Authorization': `Bearer ${env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (clerkResponse.ok) {
          const sessionData = await clerkResponse.json();
          return new Response(JSON.stringify({
            valid: true,
            userId: sessionData.user_id,
            session: sessionData
          }), { headers });
        } else {
          return new Response('{"valid":false,"error":"Invalid session"}', { 
            status: 401, headers 
          });
        }
      } catch (e) {
        return new Response('{"valid":false,"error":"Verification failed"}', { 
          status: 500, headers 
        });
      }
    }
    
    // Route: Login and get session token
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        
        if (!password) {
          return new Response('{"success":false,"error":"Password required"}', { 
            status: 400, headers 
          });
        }
        
        // Validate password with Supabase
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/validate_password`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input_password: password })
        });
        
        const isValid = await response.json();
        
        if (isValid === true) {
          // Create session token (simple JWT-like token)
          const sessionToken = btoa(JSON.stringify({
            password: password,
            created: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          }));
          
          return new Response(`{"success":true,"token":"${sessionToken}"}`, { headers });
        } else {
          return new Response('{"success":false,"error":"Invalid password"}', { 
            status: 401, headers 
          });
        }
        
      } catch (e) {
        return new Response('{"success":false,"error":"Server error"}', { 
          status: 500, headers 
        });
      }
    }
    
    // Route: Validate session token
    if (url.pathname === '/api/validate-session' && request.method === 'POST') {
      try {
        const { token } = await request.json();
        
        if (!token) {
          return new Response('{"valid":false,"error":"Token required"}', { 
            status: 400, headers 
          });
        }
        
        // Decode and validate token
        const session = JSON.parse(atob(token));
        const now = Date.now();
        
        if (now > session.expires) {
          return new Response('{"valid":false,"error":"Token expired"}', { 
            status: 401, headers 
          });
        }
        
        // Re-validate password with Supabase
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/validate_password`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input_password: session.password })
        });
        
        const isValid = await response.json();
        return new Response(`{"valid":${isValid === true}}`, { headers });
        
      } catch (e) {
        return new Response('{"valid":false,"error":"Invalid token"}', { 
          status: 401, headers 
        });
      }
    }
    
    // Protected API example
    if (url.pathname === '/api/protected-data' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return new Response('{"error":"Authorization required"}', { 
          status: 401, headers 
        });
      }
      
      // Validate session
      try {
        const session = JSON.parse(atob(token));
        const now = Date.now();
        
        if (now > session.expires) {
          return new Response('{"error":"Session expired"}', { 
            status: 401, headers 
          });
        }
        
        // Return protected data
        return new Response('{"data":"This is protected content!","user":"authenticated"}', { 
          headers 
        });
        
      } catch (e) {
        return new Response('{"error":"Invalid session"}', { 
          status: 401, headers 
        });
      }
    }
    
    // Default 404
    return new Response('{"error":"Not found"}', { status: 404, headers });
  }
};