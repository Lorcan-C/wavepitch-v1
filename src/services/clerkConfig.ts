// Clerk configuration service that fetches the publishable key from Cloudflare Worker
export class ClerkConfigService {
  private static instance: ClerkConfigService;
  private publishableKey: string | null = null;
  
  private constructor() {}
  
  static getInstance(): ClerkConfigService {
    if (!ClerkConfigService.instance) {
      ClerkConfigService.instance = new ClerkConfigService();
    }
    return ClerkConfigService.instance;
  }
  
  async getPublishableKey(): Promise<string> {
    if (this.publishableKey) {
      return this.publishableKey;
    }
    
    try {
      // Always fetch from Cloudflare Worker
      const response = await fetch('/api/clerk/config');
      if (!response.ok) {
        throw new Error('Failed to fetch Clerk configuration');
      }
      
      const data = await response.json();
      this.publishableKey = data.publishableKey;
      return data.publishableKey;
    } catch (error) {
      console.error('Failed to get Clerk publishable key:', error);
      throw error;
    }
  }
  
  async verifySession(sessionToken: string): Promise<boolean> {
    try {
      const response = await fetch('/api/clerk/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Failed to verify session:', error);
      return false;
    }
  }
}

export const clerkConfig = ClerkConfigService.getInstance();