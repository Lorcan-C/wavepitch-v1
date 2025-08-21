class AuthService {
  private token: string | null = null;

  // Login with password and get session token
  async login(password: string, trackEvent?: (event: string, properties?: any) => void): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://wavepitch-v1.lorcanclarke.workers.dev/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();
      
      if (result.success && result.token) {
        this.token = result.token;
        localStorage.setItem('auth-token', result.token);
        
        // Track successful login
        trackEvent?.('user_logged_in', { method: 'password' });
        
        return { success: true };
      } else {
        // Track failed login attempt
        trackEvent?.('login_failed', {
          method: 'password',
          error: result.error
        });
        
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Track login error
      trackEvent?.('login_error', {
        method: 'password',
        error: 'Server error'
      });
      
      return { success: false, error: 'Server error' };
    }
  }

  // Check if user has valid session
  async isAuthenticated(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch('https://wavepitch-v1.lorcanclarke.workers.dev/api/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Get protected data (example API call)
  async getProtectedData(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('https://wavepitch-v1.lorcanclarke.workers.dev/api/protected-data', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch protected data');
    }

    return response.json();
  }

  // Logout
  logout(): void {
    this.token = null;
    localStorage.removeItem('auth-token');
  }

  // Get token from memory or localStorage
  private getToken(): string | null {
    if (this.token) return this.token;
    
    const stored = localStorage.getItem('auth-token');
    if (stored) {
      this.token = stored;
      return stored;
    }
    
    return null;
  }
}

export const authService = new AuthService();

// Backward compatibility
export const passwordServiceV2 = {
  async validatePassword(password: string): Promise<boolean> {
    const result = await authService.login(password);
    return result.success;
  }
};