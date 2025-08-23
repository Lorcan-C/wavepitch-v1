// Simple password authentication service
class PasswordAuthService {
  private readonly TOKEN_KEY = 'auth-token';

  async validatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();
      
      if (result.success && result.token) {
        // Store token in localStorage
        localStorage.setItem(this.TOKEN_KEY, result.token);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error || 'Invalid password' 
      };
    } catch (error) {
      console.error('Password validation error:', error);
      return { 
        success: false, 
        error: 'Error validating password. Please try again.' 
      };
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}

export const authService = new PasswordAuthService();

// Legacy compatibility (if needed)
export const passwordServiceV2 = {
  validatePassword: (password: string) => authService.validatePassword(password)
};