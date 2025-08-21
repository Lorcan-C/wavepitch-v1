class PasswordServiceV2 {
  async validatePassword(inputPassword: string): Promise<boolean> {
    try {
      // Call Cloudflare Pages Function to validate password
      const response = await fetch('/api/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword })
      })

      if (!response.ok) {
        console.error('Password validation request failed:', response.status)
        return false
      }

      const result = await response.json()
      return result.isValid === true
    } catch (error) {
      console.error('Password validation failed:', error)
      return false
    }
  }
}

export const passwordServiceV2 = new PasswordServiceV2()