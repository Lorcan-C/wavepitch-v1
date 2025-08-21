export async function onRequestPost(context) {
  try {
    const { password } = await context.request.json()
    
    if (!password) {
      return Response.json({ isValid: false, error: 'Password required' })
    }

    // Query Supabase to validate password
    const supabaseResponse = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/rpc/validate_password`,
      {
        method: 'POST',
        headers: {
          'apikey': context.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input_password: password })
      }
    )

    const result = await supabaseResponse.json()
    
    if (result.error) {
      console.error('Supabase error:', result.error)
      return Response.json({ isValid: false, error: 'Validation failed' })
    }

    return Response.json({ 
      isValid: result.data || false 
    })

  } catch (error) {
    console.error('Worker error:', error)
    return Response.json({ isValid: false, error: 'Server error' })
  }
}