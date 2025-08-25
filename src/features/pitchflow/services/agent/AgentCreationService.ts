
import { Agent } from '../../../../shared/types/agent';

import { serviceRegistry } from '../ServiceRegistry';

interface SmartAgentSuggestion {
  name: string;
  role: string;
  expertise: string;
  description: string;
}

interface GenerationContext {
  originalTopic: string;
  userRole?: string;
  contextType: 'workplace' | 'personal-workplace' | 'general';
  expertType: string;
  relationshipToUser?: string;
  promptUsed?: string;
  isSpecificPerson?: boolean;
}

export class AgentCreationService {
  static async generateSingleExpert(prompt: string, timeout: number = 15000, attemptNumber: number = 0): Promise<SmartAgentSuggestion | null> {
    try {
      console.log('AgentCreationService: Generating single expert with prompt length:', prompt.length);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const aiService = serviceRegistry.getTextGenerationService();
      
      // Dynamic temperature based on context and attempt
      const temperature = this.getContextualTemperature(prompt, attemptNumber);
      
      // Add randomization to prompt
      const randomizedPrompt = this.addRandomizationToPrompt(prompt, attemptNumber);
      
      const response = await aiService.generateText([
        { role: 'user', content: randomizedPrompt }
      ], { signal: controller.signal, temperature, maxOutputTokens: 1200 });
      
      clearTimeout(timeoutId);
      
      if (!response) {
        console.warn('AgentCreationService: Empty response from AI service');
        return null;
      }
      
      console.log('AgentCreationService: Raw AI response:', response.substring(0, 200) + '...');
      
      // Extract JSON from response (handle both raw JSON and markdown-wrapped JSON)
      let jsonStr = response;
      
      // First try to extract from markdown code block
      const markdownMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        jsonStr = markdownMatch[1];
      } else {
        // Fall back to extracting raw JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn('AgentCreationService: No JSON found in response');
          return null;
        }
        jsonStr = jsonMatch[0];
      }
      
      const parsedAgent = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!parsedAgent.name || !parsedAgent.role) {
        console.warn('AgentCreationService: Missing required fields in parsed agent');
        return null;
      }
      
      const expert: SmartAgentSuggestion = {
        name: parsedAgent.name,
        role: parsedAgent.role,
        expertise: parsedAgent.expertise || parsedAgent.role,
        description: parsedAgent.description || `Expert in ${parsedAgent.expertise || parsedAgent.role}`
      };
      
      console.log('AgentCreationService: Successfully generated expert:', expert.name, '-', expert.role);
      return expert;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('AgentCreationService: Generation timed out');
      } else {
        console.error('AgentCreationService: Error generating expert:', error);
      }
      return null;
    }
  }

  private static getContextualTemperature(prompt: string, attemptNumber: number): number {
    // Base temperature varies by context
    let baseTemperature = 0.8;
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Higher creativity for personal/creative contexts
    if (lowerPrompt.includes('creative') || lowerPrompt.includes('hobby') || lowerPrompt.includes('personal')) {
      baseTemperature = 1.0;
    }
    
    // Lower temperature for professional/technical contexts
    if (lowerPrompt.includes('workplace') || lowerPrompt.includes('technical') || lowerPrompt.includes('analysis')) {
      baseTemperature = 0.7;
    }
    
    // Increase temperature with retry attempts
    const attemptBonus = attemptNumber * 0.1;
    
    return Math.min(baseTemperature + attemptBonus, 1.2);
  }

  private static addRandomizationToPrompt(prompt: string, attemptNumber: number): string {
    const randomSeeds = [
      "Think creatively and suggest someone unexpected who would bring unique value.",
      "Consider diverse perspectives and suggest someone with a different background.",
      "Focus on practical expertise and suggest someone with hands-on experience.",
      "Think about innovative approaches and suggest someone with fresh ideas.",
      "Consider international or multicultural perspectives.",
    ];
    
    const seedPhrase = randomSeeds[attemptNumber % randomSeeds.length];
    
    return `${prompt}\n\nAdditional guidance: ${seedPhrase}`;
  }
  
  static async convertAndStoreBatch(
    suggestions: SmartAgentSuggestion[], 
    contexts: GenerationContext[]
  ): Promise<Agent[]> {
    console.log('AgentCreationService: Converting and storing batch with enhanced context');
    console.log('Suggestions count:', suggestions.length);
    console.log('Contexts count:', contexts.length);
    
    const agents = await Promise.all(suggestions.map(async (suggestion, index) => {
      const context = contexts[index];
      const agentId = `agent-${Date.now()}-${index}`;
      
      // Generate enhanced profile based on context
      const enhancedProfile = this.generateEnhancedProfile(suggestion, context);
      
      // Generate personality traits
      const personalityTraits = await this.generatePersonalityTraits(suggestion, context);
      
      const agent: Agent = {
        id: agentId,
        name: suggestion.name,
        role: suggestion.role,
        description: suggestion.description,
        expertise: suggestion.expertise,
        avatar: '/placeholder.svg',
        color: this.generateAgentColor(index),
        source: 'custom',
        
        // Enhanced context fields
        relationshipToUser: context.relationshipToUser,
        generationContext: {
          originalTopic: context.originalTopic,
          userRole: context.userRole,
          contextType: context.contextType,
          expertType: context.expertType,
          isSpecificPerson: context.isSpecificPerson
        },
        enhancedProfile,
        aiMetadata: {
          generatedAt: new Date().toISOString(),
          promptUsed: context.promptUsed,
          generationSuccess: true
        }
      };

      // Add personality traits to enhanced profile
      if (personalityTraits) {
        agent.enhancedProfile = {
          ...agent.enhancedProfile,
          personalityTraits
        };
      }
      
      console.log(`AgentCreationService: Created enhanced agent ${agent.name} with personality traits`);
      return agent;
    }));

    return agents;
  }
  
  private static generateEnhancedProfile(
    suggestion: SmartAgentSuggestion, 
    context: GenerationContext
  ) {
    const profile: any = {};
    
    // Generate background based on context type
    if (context.contextType === 'workplace' || context.contextType === 'personal-workplace') {
      profile.background = `Professional with extensive experience in ${suggestion.expertise}`;
      
      if (context.relationshipToUser?.includes('manager')) {
        profile.decisionMakingAuthority = 'High - can make strategic decisions';
        profile.workingStyle = 'Directive and results-oriented';
      } else if (context.relationshipToUser?.includes('peer')) {
        profile.decisionMakingAuthority = 'Medium - collaborative decision making';
        profile.workingStyle = 'Collaborative and supportive';
      } else if (context.relationshipToUser?.includes('accountant') || context.relationshipToUser?.includes('lawyer')) {
        profile.decisionMakingAuthority = 'Advisory - provides expert recommendations';
        profile.workingStyle = 'Analytical and detail-oriented';
      }
    }
    
    // Set specialization based on expert type
    profile.specialization = this.mapExpertTypeToSpecialization(context.expertType, suggestion.expertise);
    profile.yearsOfExperience = this.generateExperienceLevel(context.expertType);
    
    return profile;
  }
  
  private static mapExpertTypeToSpecialization(expertType: string, expertise: string): string {
    const mapping: Record<string, string> = {
      'Big-picture': `Strategic ${expertise} planning and vision`,
      'Practical / step-by-step': `Operational ${expertise} implementation`,
      'Creative Problem Solver': `Innovative ${expertise} solutions`,
      'Specific Person': `Specialized ${expertise} consultation`
    };
    
    return mapping[expertType] || `Professional ${expertise} expertise`;
  }
  
  private static generateExperienceLevel(expertType: string): string {
    const experienceLevels: Record<string, string> = {
      'Big-picture': '15+ years with leadership experience',
      'Practical / step-by-step': '10+ years of hands-on experience',
      'Creative Problem Solver': '8+ years with innovation focus',
      'Specific Person': 'Extensive experience in their specialty'
    };
    
    return experienceLevels[expertType] || '5+ years of professional experience';
  }
  
  private static async generatePersonalityTraits(
    suggestion: SmartAgentSuggestion,
    context: GenerationContext
  ): Promise<any> {
    try {
      const personalityPrompt = `Generate distinctive personality traits for this AI agent that will make them behave authentically and create productive discourse in meetings.

AGENT PROFILE:
- Name: ${suggestion.name}
- Role: ${suggestion.role}
- Expertise: ${suggestion.expertise}
- Description: ${suggestion.description}

MEETING CONTEXT:
- Topic: ${context.originalTopic}
- Context Type: ${context.contextType}
- User Role: ${context.userRole || 'meeting organizer'}

Generate personality traits in this exact JSON format:
{
  "communicationStyle": "[direct/diplomatic/analytical/enthusiastic/cautious - pick one that fits their role]",
  "decisionMakingApproach": "[data-driven/intuitive/consensus-building/quick-decisive/thorough-deliberate - pick one]", 
  "meetingBehavior": "[often asks clarifying questions/likes to summarize key points/challenges assumptions/builds on others' ideas/focuses on practical next steps - pick 1-2]",
  "workingStyle": "[methodical and structured/flexible and adaptive/proactive and forward-thinking/collaborative team-player/independent self-starter - pick one]",
  "personalityQuirks": "[uses specific phrases, has particular concerns, references experience, shows enthusiasm for certain topics - 1-2 authentic quirks]",
  "conversationTriggers": "[what topics or situations make them most engaged or concerned - 1-2 specific triggers]",
  "conflictStyle": "[how they handle disagreement - diplomatic mediator/fact-based challenger/solution-focused/devil's advocate/supportive questioner]"
}

Make the personality authentic to their professional role and expertise, distinctive from other meeting participants, and designed to create natural productive tension and diverse viewpoints.`;

      const aiService = serviceRegistry.getTextGenerationService();
      const response = await aiService.generateText([
        { role: 'user', content: personalityPrompt }
      ], { temperature: 0.7, maxOutputTokens: 1200 });

      if (!response) {
        console.warn('AgentCreationService: Failed to generate personality traits');
        return null;
      }

      // Extract JSON from response (handle both raw JSON and markdown-wrapped JSON)
      let jsonStr = response;
      
      // First try to extract from markdown code block
      const markdownMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        jsonStr = markdownMatch[1];
      } else {
        // Fall back to extracting raw JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn('AgentCreationService: No JSON found in personality traits response');
          return null;
        }
        jsonStr = jsonMatch[0];
      }

      const personalityTraits = JSON.parse(jsonStr);
      console.log(`AgentCreationService: Generated personality traits for ${suggestion.name}`);
      return personalityTraits;

    } catch (error) {
      console.error('AgentCreationService: Error generating personality traits:', error);
      return null;
    }
  }

  private static generateAgentColor(index: number): string {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
    ];
    return colors[index % colors.length];
  }
}
