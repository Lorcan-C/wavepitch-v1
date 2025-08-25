import { serviceRegistry } from './ServiceRegistry';
import { prompts } from '../../../shared/lib/prompts';
import { Agent } from '../../../shared/types/agent';
import { MeetingDocument } from '../../../shared/types/document';
import { langfuseService } from './langfuseService';

// Interface for the processed pitch context
interface ProcessedPitchContext {
  topic: string;
  opportunity: string;
  stakeholders: Array<{
    name: string;
    role: string;
    relationship: string;
    mentioned_as: string;
    involvement_level: 'high' | 'medium' | 'low';
  }>;
  context: 'workplace' | 'pitch' | 'general';
  user_role: string;
  key_points: string[];
  meeting_goal: string;
  urgency: 'high' | 'medium' | 'low';
  preparation_notes: string;
}

// Interface for GeneratedExpert (from useAgentGeneration)
interface GeneratedExpert {
  id: string;
  name: string;
  role: string;
  description: string;
  isEditing: boolean;
  isExpanded: boolean;
  isEditingDescription: boolean;
}

// Result interface for the complete pitch processing
interface PitchProcessingResult {
  processedContext: ProcessedPitchContext;
  agents: Agent[];
  experts: GeneratedExpert[];
  metadata: {
    processingTime: number;
    tokenUsage: {
      input: number;
      output: number;
    };
    aiProvider: string;
    qualityScore: number;
  };
}

export class SimplePitchService {
  private static instance: SimplePitchService;

  public static getInstance(): SimplePitchService {
    if (!SimplePitchService.instance) {
      SimplePitchService.instance = new SimplePitchService();
    }
    return SimplePitchService.instance;
  }

  /**
   * Main entry point - processes pitch input and generates meeting agents
   */
  async processPitchFlow(
    userInput: string,
    documents: MeetingDocument[] = [],
    onProgress?: (progress: number, step: string) => void
  ): Promise<PitchProcessingResult> {
    const startTime = Date.now();
    
    try {
      onProgress?.(10, 'Analyzing pitch input...');
      
      // Step 1: Process the pitch input using unified prompt
      const processedContext = await this.processPitchInput(userInput, documents);
      onProgress?.(50, 'Generating meeting participants...');
      
      // Step 2: Generate agents based on processed context
      const agents = await this.generateMeetingAgents(processedContext);
      onProgress?.(80, 'Finalizing participants...');
      
      // Step 3: Convert agents to experts format for compatibility
      const experts = this.convertAgentsToExperts(agents);
      onProgress?.(90, 'Quality validation...');
      
      // Step 4: Calculate metadata
      const metadata = {
        processingTime: Date.now() - startTime,
        tokenUsage: this.estimateTokenUsage(userInput, documents, agents),
        aiProvider: serviceRegistry.getActiveTextGenerationServiceId(),
        qualityScore: this.calculateQualityScore(processedContext, agents)
      };
      
      onProgress?.(100, 'Complete!');
      
      return {
        processedContext,
        agents,
        experts,
        metadata
      };
      
    } catch (error) {
      console.error('[SimplePitchService] Processing failed:', error);
      throw new Error(`Pitch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 1: Process pitch input and extract structured context
   */
  private async processPitchInput(
    userInput: string, 
    documents: MeetingDocument[]
  ): Promise<ProcessedPitchContext> {
    const textGenerationService = serviceRegistry.getTextGenerationService();
    
    // Prepare document context
    const documentContext = documents.length > 0 
      ? documents.map(doc => `**${doc.filename}**: ${doc.content?.slice(0, 1000) || 'No content available'}`).join('\n\n')
      : 'No documents provided';
    
    // Get prompt from Langfuse
    const promptData = await langfuseService.getPrompt('unified-pitch-processing-input');
    const prompt = promptData.compile({
      userInput,
      documents: documentContext
    });
    
    try {
      const response = await textGenerationService.generateText([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Please analyze this pitch input and return the structured JSON response.' }
      ], {
        temperature: 0.3,
        maxOutputTokens: 2000
      });
      
      // Parse the JSON response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const parsedContext = JSON.parse(jsonMatch[1]);
      
      // Validate the response structure
      this.validateProcessedContext(parsedContext);
      
      return parsedContext;
      
    } catch (error) {
      console.error('[SimplePitchService] Pitch input processing failed:', error);
      throw new Error(`Failed to process pitch input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 2: Generate meeting agents based on processed context
   */
  private async generateMeetingAgents(context: ProcessedPitchContext): Promise<Agent[]> {
    const textGenerationService = serviceRegistry.getTextGenerationService();
    
    try {
      // Get prompt from Langfuse (no fallback)
      const promptData = await langfuseService.getPrompt(
        'pitch-flow-generate-meeting-agents'
      );
      
      // Compile the prompt with variables
      const prompt = promptData.compile({
        processedContext: JSON.stringify(context, null, 2)
      });
      
      console.log(`[SimplePitchService] Using Langfuse prompt: pitch-flow-generate-meeting-agents`);
      
      // Create trace for monitoring
      const trace = langfuseService.createTrace('pitch-flow-agent-generation', {
        service: 'SimplePitchService',
        method: 'generateMeetingAgents',
        contextType: context.context,
        topic: context.topic,
        stakeholdersCount: context.stakeholders.length,
        promptSource: 'langfuse'
      });
      
      const response = await textGenerationService.generateText([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate 3 diverse professional agents for this meeting context.' }
      ], {
        temperature: 0.7,
        maxOutputTokens: 3000
      });
      
      // Parse the JSON response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in agent response');
      }
      
      const agentsData = JSON.parse(jsonMatch[1]);
      
      // Convert to Agent format
      const agents: Agent[] = agentsData.agents?.map((agentData: any, index: number) => ({
        id: `agent-${Date.now()}-${index}`,
        name: agentData.name,
        role: agentData.role,
        description: agentData.description,
        type: agentData.type || 'professional',
        expertise: agentData.expertise,
        avatar_url: agentData.avatar_url,
        color: this.generateAgentColor(index),
        source: 'custom' as const,
        tone: agentData.tone || 'professional',
        style: agentData.style || 'collaborative',
        relationshipToUser: agentData.relationshipToUser,
        communicationStyle: agentData.communicationStyle || 'standard',
        generationContext: {
          originalTopic: context.topic,
          userRole: context.user_role,
          contextType: context.context,
          expertType: agentData.expertType || 'Professional',
          isSpecificPerson: agentData.isSpecificPerson || false
        },
        aiMetadata: {
          generatedAt: new Date().toISOString(),
          promptUsed: 'pitch-flow-generate-meeting-agents',
          generationSuccess: true,
          langfuseTrace: trace?.id || null
        }
      })) || [];
      
      if (agents.length === 0) {
        throw new Error('No agents were generated');
      }
      
      // Log success to trace
      if (trace) {
        trace.update({
          output: { agentsGenerated: agents.length, success: true }
        });
      }
      
      return agents;
      
    } catch (error) {
      console.error('[SimplePitchService] Agent generation failed:', error);
      throw new Error(`Failed to generate meeting agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Agent[] to GeneratedExpert[] for compatibility with useAgentGeneration
   */
  convertAgentsToExperts(agents: Agent[]): GeneratedExpert[] {
    return agents.map((agent, index) => ({
      id: `expert-${index}`,
      name: agent.name,
      role: agent.role || 'Expert',
      description: agent.description || 'Professional expert in their field',
      isEditing: false,
      isExpanded: false,
      isEditingDescription: false
    }));
  }

  /**
   * Validate the processed context structure
   */
  private validateProcessedContext(context: any): void {
    const requiredFields = ['topic', 'opportunity', 'stakeholders', 'context', 'user_role', 'key_points', 'meeting_goal'];
    
    for (const field of requiredFields) {
      if (!context[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!Array.isArray(context.stakeholders)) {
      throw new Error('Stakeholders must be an array');
    }
    
    if (!Array.isArray(context.key_points)) {
      throw new Error('Key points must be an array');
    }
    
    if (!['workplace', 'pitch', 'general'].includes(context.context)) {
      throw new Error('Invalid context type');
    }
  }

  /**
   * Generate appropriate colors for agents
   */
  private generateAgentColor(index: number): string {
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      'hsl(220, 70%, 50%)',
      'hsl(280, 70%, 50%)',
      'hsl(160, 70%, 50%)'
    ];
    return colors[index % colors.length];
  }

  /**
   * Estimate token usage for metadata
   */
  private estimateTokenUsage(userInput: string, documents: MeetingDocument[], agents: Agent[]): { input: number; output: number } {
    const inputTokens = Math.ceil((userInput.length + 
      documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0)) / 4);
    
    const outputTokens = Math.ceil(agents.reduce((sum, agent) => 
      sum + (agent.name.length + (agent.description?.length || 0) + (agent.role?.length || 0)), 0) / 4);
    
    return { input: inputTokens, output: outputTokens };
  }

  /**
   * Calculate quality score based on generated content
   */
  private calculateQualityScore(context: ProcessedPitchContext, agents: Agent[]): number {
    let score = 0;
    
    // Context quality (40%)
    if (context.topic && context.topic.length > 5) score += 15;
    if (context.stakeholders.length > 0) score += 10;
    if (context.key_points.length >= 2) score += 10;
    if (context.meeting_goal && context.meeting_goal.length > 10) score += 5;
    
    // Agent quality (60%)
    const agentScore = agents.reduce((sum, agent) => {
      let agentPoints = 0;
      if (agent.name && agent.name.length > 2) agentPoints += 5;
      if (agent.description && agent.description.length > 20) agentPoints += 10;
      if (agent.role && agent.role.length > 3) agentPoints += 5;
      return sum + agentPoints;
    }, 0);
    
    score += Math.min(agentScore, 60);
    
    return Math.min(score, 100);
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const textService = serviceRegistry.getTextGenerationService();
      const testResult = await textService.generateText([
        { role: 'user', content: 'Test message for health check' }
      ], { temperature: 0.1, maxOutputTokens: 50 });
      
      return {
        status: 'healthy',
        details: {
          aiProvider: serviceRegistry.getActiveTextGenerationServiceId(),
          responseLength: testResult.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Export singleton instance
export const simplePitchService = SimplePitchService.getInstance();