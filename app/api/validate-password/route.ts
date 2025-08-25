export const runtime = 'edge';

export async function POST(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { password } = await request.json();
    
    if (!password) {
      return new Response(
        JSON.stringify({ isValid: false, error: 'Password required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Query Supabase to validate password
    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/validate_password`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input_password: password })
      }
    );

    const result = await supabaseResponse.json();
    
    if (result.error) {
      console.error('Supabase error:', result.error);
      return new Response(
        JSON.stringify({ isValid: false, error: 'Validation failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ isValid: result.data || false }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ isValid: false, error: 'Server error' }),
      { status: 500, headers: corsHeaders }
    );
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