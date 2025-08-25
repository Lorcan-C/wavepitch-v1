import { openAIService } from './ai/OpenAIService';

// Service Registry to provide centralized access to all AI and external services
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  
  private constructor() {
    console.log('ServiceRegistry: Initialized');
  }
  
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
  
  // Text generation service (OpenAI)
  getTextGenerationService() {
    return {
      generateText: async (
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, 
        options?: {
          temperature?: number;
          maxOutputTokens?: number;
          signal?: AbortSignal;
          model?: string;
        }
      ): Promise<string> => {
        return await openAIService.generateText(messages, options);
      }
    };
  }
  
  // Perplexity service for research (placeholder for now)
  getPerplexityService() {
    return {
      performResearch: async (query: string): Promise<string> => {
        console.warn('ServiceRegistry: Perplexity service not implemented, returning mock data');
        return `Mock research results for: "${query}"\n\nBased on current market trends, this appears to be a growing opportunity with significant potential for digital transformation and process optimization.`;
      }
    };
  }
  
  // Supabase client (placeholder for now)
  getSupabaseClient() {
    return {
      from: (table: string) => ({
        select: () => ({
          data: [],
          error: null
        }),
        insert: () => ({
          data: null,
          error: null
        }),
        update: () => ({
          data: null,
          error: null
        })
      })
    };
  }
  
  // Document processing service
  getDocumentService() {
    return {
      processDocument: async (file: File): Promise<any> => {
        console.warn('ServiceRegistry: Document service not implemented');
        return {
          filename: file.name,
          content: 'Mock document content',
          summary: 'Mock document summary'
        };
      }
    };
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();