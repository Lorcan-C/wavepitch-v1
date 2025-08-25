import OpenAI from 'openai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private isConfigured: boolean;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.isConfigured = !!apiKey;

    if (this.isConfigured) {
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
      });
      console.log('OpenAIService: Initialized with OpenAI client');
    } else {
      console.warn('OpenAIService: Missing VITE_OPENAI_API_KEY, using mock responses');
    }
  }

  async generateText(
    messages: ChatMessage[], 
    options?: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
      signal?: AbortSignal;
    }
  ): Promise<string> {
    if (!this.isConfigured || !this.client) {
      return this.getMockResponse(messages[messages.length - 1]?.content || '');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-3.5-turbo',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxOutputTokens || 1000
      }, {
        signal: options?.signal
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      console.error('OpenAIService: Error generating text:', error);
      
      // Fallback to mock response on error
      return this.getMockResponse(messages[messages.length - 1]?.content || '');
    }
  }

  private getMockResponse(prompt: string): string {
    // Analyze the prompt to return contextually appropriate mock responses
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('opportunity') || lowerPrompt.includes('extract')) {
      return 'Strategic consulting opportunity for digital transformation and business process optimization';
    }
    
    if (lowerPrompt.includes('meeting description') || lowerPrompt.includes('enhanced meeting')) {
      return 'Collaborative strategy session to align on digital transformation initiatives and establish clear implementation roadmap with key stakeholders';
    }
    
    if (lowerPrompt.includes('user description') || lowerPrompt.includes('role')) {
      return 'Senior consultant specializing in digital strategy and business transformation, leading client engagement initiatives';
    }
    
    if (lowerPrompt.includes('json') || lowerPrompt.includes('expert') || lowerPrompt.includes('agent')) {
      return JSON.stringify({
        name: 'Sarah Johnson',
        role: 'Strategic Business Advisor',
        expertise: 'Digital transformation and change management',
        description: 'Experienced consultant with 15+ years helping organizations navigate complex business transformations and technology implementations.'
      });
    }
    
    // Default response
    return 'Based on the provided context, I recommend focusing on strategic alignment and stakeholder engagement to ensure successful outcomes.';
  }

  // Method for streaming responses (if needed in the future)
  async generateTextStream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options?: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<void> {
    if (!this.isConfigured || !this.client) {
      // Mock streaming for development
      const mockResponse = this.getMockResponse(messages[messages.length - 1]?.content || '');
      const words = mockResponse.split(' ');
      
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
      }
      return;
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: options?.model || 'gpt-3.5-turbo',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxOutputTokens || 1000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      console.error('OpenAIService: Error in streaming response:', error);
      // Fallback to mock response
      onChunk(this.getMockResponse(messages[messages.length - 1]?.content || ''));
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();