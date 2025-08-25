import { Langfuse } from 'langfuse';

interface LangfusePrompt {
  text: string;
  variables?: any;
}

export class LangfuseService {
  private client: Langfuse;
  private isConfigured: boolean;

  constructor() {
    const publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY;
    const secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY;
    const baseUrl = import.meta.env.VITE_LANGFUSE_BASEURL || 'https://cloud.langfuse.com';

    this.isConfigured = !!(publicKey && secretKey);

    if (this.isConfigured) {
      this.client = new Langfuse({
        publicKey,
        secretKey,
        baseUrl
      });
      console.log('LangfuseService: Initialized with Langfuse client');
    } else {
      console.warn('LangfuseService: Missing environment variables, using fallback prompts');
    }
  }

  async getPrompt(name: string): Promise<LangfusePrompt> {
    if (!this.isConfigured) {
      return this.getFallbackPrompt(name);
    }

    try {
      const prompt = await this.client.getPrompt(name);
      
      if (prompt) {
        return {
          text: prompt.prompt,
          variables: prompt.config?.variables || {}
        };
      } else {
        console.warn(`LangfuseService: Prompt "${name}" not found, using fallback`);
        return this.getFallbackPrompt(name);
      }
    } catch (error) {
      console.error(`LangfuseService: Error fetching prompt "${name}":`, error);
      return this.getFallbackPrompt(name);
    }
  }

  private getFallbackPrompt(name: string): LangfusePrompt {
    // Define fallback prompts for common patterns used in PitchFlow
    const fallbackPrompts: Record<string, string> = {
      'meeting-system/pre-meeting/meeting-generation/extract-opportunity': `
Extract the key business opportunity from the following pitch information:

Pitch Information: {{pitchInfo}}
Documents: {{documents}}

Analyze the information and return a clear, concise opportunity statement that captures:
- The main value proposition
- Target audience or market
- Key problem being solved
- Potential business impact

Return only the opportunity statement, no additional formatting.`,

      'pre-meeting/client-opportunity-analysis/enhanced-meeting-description': `
Generate an enhanced meeting description based on the following context:

Business Opportunity: {{opportunity}}
Pitch Information: {{pitchInfo}}
Supporting Documents: {{documents}}
Expert Team Context: {{expertContext}}

Create a compelling 2-3 sentence meeting description that:
- Clearly states the meeting purpose
- Highlights the value proposition
- Sets expectations for outcomes
- References the assembled expert team when relevant

Keep it professional, concise, and focused on value.`,

      'pre-meeting/client-opportunity-analysis/user-description': `
Analyze the user's role and position based on the following information:

Pitch Information: {{pitchInfo}}
Supporting Documents: {{documents}}
Expert Team Context: {{expertContext}}
Relationship Context: {{relationshipContext}}

Generate a brief description of the user's role that covers:
- Their primary responsibility or title
- Their relationship to the opportunity
- Their expertise or background
- {{relationshipContext}}

Keep the description concise (1-2 sentences) and professional.`,
      
      'agent-generation/person-specific-prompt': `
Generate a detailed profile for a specific person mentioned in the meeting context:

Person Information: {{personName}} - {{personRole}}
Meeting Topic: {{topic}}
User Role: {{userRole}}
Relationship: {{relationship}}
Context Type: {{contextType}}

Create a realistic professional profile including:
- Full name and professional title
- Relevant expertise and background
- Communication style and personality traits
- How they relate to the meeting topic
- Their working relationship with the user

Return as JSON format:
{
  "name": "Full Name",
  "role": "Professional Title",
  "expertise": "Area of expertise",
  "description": "2-3 sentence professional description"
}`,

      'agent-generation/complementary-expert-prompt': `
Generate a complementary expert profile for this meeting:

Meeting Topic: {{topic}}
User Role: {{userRole}}
Expert Type: {{expertType}}
Existing Team Members: {{existingExperts}}
Detected People: {{detectedPeople}}

Create a professional expert who complements the existing team with {{expertType}} perspective.
Ensure they bring unique value and don't duplicate existing expertise.

Return as JSON format:
{
  "name": "Full Name",
  "role": "Professional Title with {{expertType}} focus",
  "expertise": "Specific area of expertise",
  "description": "2-3 sentence description of their value to the meeting"
}`
    };

    return {
      text: fallbackPrompts[name] || `Fallback prompt for ${name}:

Context: {{pitchInfo}}
Documents: {{documents}}

Please provide relevant analysis or advice based on the context provided.`,
      variables: {}
    };
  }

  // Create a trace for observability (when Langfuse is configured)
  createTrace(name: string, metadata?: any) {
    if (!this.isConfigured) return null;
    
    try {
      return this.client.trace({
        name,
        metadata
      });
    } catch (error) {
      console.error('LangfuseService: Error creating trace:', error);
      return null;
    }
  }

  // Flush pending events before app shutdown
  async flush() {
    if (this.isConfigured && this.client) {
      try {
        await this.client.flushAsync();
      } catch (error) {
        console.error('LangfuseService: Error flushing events:', error);
      }
    }
  }
}

// Export singleton instance
export const langfuseService = new LangfuseService();