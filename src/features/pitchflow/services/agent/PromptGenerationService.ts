import { ContextDetectionService } from './ContextDetectionService';
import { DetectedPerson } from './PersonDetectionService';
import { prompts, fill } from '@/shared/lib/prompts';
import { langfuseService } from '../services/langfuseService';

interface SmartAgentSuggestion {
  name: string;
  role: string;
  expertise: string;
  description: string;
}

export class PromptGenerationService {
  static buildPreviousExpertsContext(previousExperts: SmartAgentSuggestion[]): string {
    if (previousExperts.length === 0) return '';

    const expertsList = previousExperts.map((expert, index) => 
      `Expert ${index + 1}: ${expert.name} - ${expert.role} (${expert.expertise})`
    ).join('\n');
    
    return `\n\nIMPORTANT: The following participants have already been selected for this meeting:
${expertsList}

You MUST create a participant with a COMPLETELY DIFFERENT profile, role, and expertise area. Ensure NO overlap in:
- Professional background
- Industry focus
- Methodological approach
- Skill sets
- Areas of specialization

Make this participant distinctly different and complementary to the existing team members.`;
  }

  static createPersonSpecificPrompt(
    person: DetectedPerson,
    topic: string,
    userRole?: string,
    contextType?: string
  ): string {
    return `Based on this topic: "${topic}"
${userRole ? `User's role: ${userRole}` : ''}

The user mentioned a specific person: "${person.originalMention}"
${person.relationship ? `Relationship: ${person.relationship}` : ''}
${person.role ? `Their role: ${person.role}` : ''}

I need you to create this person as a meeting participant. Think about:
- What would this person bring to the conversation about this topic?
- How would their relationship to the user affect their perspective?
- What expertise or viewpoint would they contribute?

Create a realistic representation of this person that would be helpful for this specific discussion.

Respond in this exact JSON format:
{
  "name": "[realistic first and last name based on the mention]",
  "role": "[their job title or role]",
  "expertise": "[what they're expert in that's relevant to this topic]",
  "description": "[how they would specifically help with this topic]"
}`;
  }

  static async createComplementaryPrompt(
    topic: string,
    userRole: string,
    expertType: any,
    existingExperts: SmartAgentSuggestion[],
    detectedPeople: DetectedPerson[]
  ): Promise<string> {
    // Build context about existing participants
    let existingContext = '';
    
    if (detectedPeople.length > 0) {
      const peopleList = detectedPeople.map(person => 
        `• ${person.name} (${person.role})`
      ).join('\n');
      existingContext += `People already included:\n${peopleList}\n\n`;
    }
    
    if (existingExperts.length > 0) {
      const expertsList = existingExperts.map(expert => 
        `• ${expert.name} - ${expert.role}`
      ).join('\n');
      existingContext += `Experts already included:\n${expertsList}\n\n`;
    }

    // Use narrative approach
    return await this.createNarrativePrompt(topic, userRole, existingContext);
  }

  private static async createNarrativePrompt(topic: string, userRole: string, existingContext: string): Promise<string> {
    console.log('[PromptGenerationService] === DEBUGGING NARRATIVE PROMPT ===');
    console.log('[PromptGenerationService] Input values:', { 
      topic: topic, 
      userRole: userRole || 'EMPTY', 
      existingContext: existingContext || 'EMPTY' 
    });
    
    const promptData = await langfuseService.getPrompt('agent-generation-narrative-prompt');
    console.log('[PromptGenerationService] Prompt source:', promptData.isFromLangfuse ? 'Langfuse' : 'Fallback');
    console.log('[PromptGenerationService] Raw template:', promptData.text.substring(0, 200) + '...');
    
    // Ensure proper variable formatting
    const compilationVars = {
      topic: topic || '',
      userRole: userRole || 'professional',
      existingContext: existingContext || ''
    };
    
    console.log('[PromptGenerationService] Compilation variables:', compilationVars);
    
    const compiledPrompt = promptData.compile(compilationVars);
    
    console.log('[PromptGenerationService] Compiled prompt length:', compiledPrompt.length);
    console.log('[PromptGenerationService] Compiled prompt preview:', compiledPrompt.substring(0, 300) + '...');
    
    // If compiled prompt is empty, use fallback
    if (!compiledPrompt || compiledPrompt.trim().length === 0) {
      console.warn('[PromptGenerationService] Langfuse compilation returned empty, using fallback');
      const fallbackPrompt = `Create ONE highly relevant expert participant for this topic: "${topic}"
        
User context: ${userRole || 'professional'}
${existingContext ? `Existing participants: ${existingContext}` : ''}

Focus on creating a participant who:
1. Has specific expertise directly relevant to: ${topic}
2. Can provide valuable insights and guidance
3. Is distinct from any existing participants
4. Has a clear professional background and communication style

Think deeply about:
- What type of expertise or perspective is missing from existing participants?
- Who would bring real value and a different viewpoint?
- What specific experiences or background would make their input valuable?
- What questions would they naturally ask about this topic?
- What concerns or objections might they raise?
- What examples or case studies from their experience would they share?

Consider their:
- Professional background and journey to their current role
- Communication style and how they'd engage in this specific discussion
- Current priorities and what metrics/outcomes they care about
- Unique perspective shaped by their specific experiences
- Natural biases or assumptions they'd bring to the discussion
- How they'd challenge or build upon ideas presented

Return JSON format:
{
  "name": "Full Name (realistic first and last name)",
  "role": "Professional Title/Role (be precise about seniority and department)",
  "expertise": "Primary area of expertise plus 2-3 secondary relevant skills",
  "description": "Comprehensive 10-15 sentence description covering: Their relevant background and what shaped their viewpoint on ${topic}. The specific value they bring to THIS conversation. 2-3 questions they would naturally ask. Key insights or examples they'd share from their experience. Any concerns or alternative viewpoints they'd raise. Their communication style (data-driven, story-based, direct, diplomatic). What success looks like from their perspective on this topic."
}`;
      
      console.log('[PromptGenerationService] Using fallback prompt length:', fallbackPrompt.length);
      return fallbackPrompt;
    }
    
    console.log('[PromptGenerationService] === END DEBUGGING ===');
    
    return compiledPrompt;
  }

  private static async createComplementaryWorkplacePrompt(
    topic: string,
    expertType: any,
    existingContext: string
  ): Promise<string> {
    let expertTypePrompt = '';
    
    switch (expertType.name) {
      case "Big-picture":
        expertTypePrompt = "create ONE workplace participant who provides strategic, high-level perspective and can make executive decisions";
        break;
      case "Practical / step-by-step":
        expertTypePrompt = "create ONE workplace participant who provides hands-on, practical guidance and understands day-to-day operations";
        break;
      case "Creative Problem Solver":
        expertTypePrompt = "create ONE workplace participant who brings innovative thinking and creative solutions to challenges";
        break;
      default:
        expertTypePrompt = expertType.prompt;
    }
    
    const promptData = await langfuseService.getPrompt('agent-generation-complementary-workplace');
    return promptData.compile({
      topic,
      expertTypePrompt,
      existingContext
    });
  }

  private static async createComplementaryExpertPrompt(
    topic: string,
    userRole: string,
    expertType: any,
    existingContext: string
  ): Promise<string> {
    console.log('[PromptGenerationService] Using Langfuse prompt: agent-generation-complementary-expert');
    
    const promptData = await langfuseService.getPrompt('agent-generation-complementary-expert');
    
    return promptData.compile({
      topic,
      userRole: userRole || 'professional',
      expertTypePrompt: expertType.prompt,
      existingContext
    });
  }

  static async createPersonalWorkplacePrompt(
    topic: string,
    expertType: any,
    previousExpertsContext: string
  ): Promise<string> {
    let expertTypePrompt = '';
    
    switch (expertType.name) {
      case "Big-picture":
        expertTypePrompt = "create ONE workplace participant who is YOUR direct manager, supervisor, or senior leader who has authority over your situation and can make decisions about your specific case";
        break;
      case "Practical / step-by-step":
        expertTypePrompt = "create ONE workplace participant who is YOUR peer, colleague, or team member who works closely with you and understands your day-to-day situation";
        break;
      case "Creative Problem Solver":
        expertTypePrompt = "create ONE workplace participant who provides specialized support for YOUR situation (like YOUR HR representative, mentor, or senior advisor who knows your background)";
        break;
      default:
        expertTypePrompt = expertType.prompt;
    }
    
    const promptData = await langfuseService.getPrompt('agent-generation-personal-workplace');
    return promptData.compile({
      topic,
      expertTypePrompt,
      previousExpertsContext
    });
  }

  static async createWorkplacePrompt(
    topic: string,
    userRole: string,
    expertType: any,
    previousExpertsContext: string
  ): Promise<string> {
    let expertTypePrompt = '';
    
    switch (expertType.name) {
      case "Big-picture":
        expertTypePrompt = "create ONE workplace participant who would be the decision-maker or senior authority figure for this workplace discussion (like a manager, director, or senior leader)";
        break;
      case "Practical / step-by-step":
        expertTypePrompt = "create ONE workplace participant who would be a peer, colleague, or team member who can provide practical perspective at the same level";
        break;
      case "Creative Problem Solver":
        expertTypePrompt = "create ONE workplace participant who would provide specialized expertise or support (like HR, a subject matter expert, or senior advisor)";
        break;
      default:
        expertTypePrompt = expertType.prompt;
    }
    
    const promptData = await langfuseService.getPrompt('agent-generation-workplace');
    return promptData.compile({
      topic,
      userRole: userRole || 'professional',
      expertTypePrompt,
      previousExpertsContext
    });
  }

  static async createExpertPrompt(
    topic: string,
    userRole: string,
    expertType: any,
    previousExpertsContext: string
  ): Promise<string> {
    const promptData = await langfuseService.getPrompt('agent-generation-expert');
    return promptData.compile({
      topic,
      userRole: userRole || 'professional',
      expertTypePrompt: expertType.prompt,
      previousExpertsContext
    });
  }

  static async createContextualPrompt(
    topic: string,
    userRole: string,
    expertType: any,
    previousExperts: SmartAgentSuggestion[]
  ): Promise<string> {
    const context = ContextDetectionService.analyzeContext(topic);
    const previousExpertsContext = this.buildPreviousExpertsContext(previousExperts);

    if (context.isWorkplace && context.isPersonal) {
      return await this.createPersonalWorkplacePrompt(topic, expertType, previousExpertsContext);
    }

    if (context.isWorkplace) {
      return await this.createWorkplacePrompt(topic, userRole, expertType, previousExpertsContext);
    }

    return await this.createExpertPrompt(topic, userRole, expertType, previousExpertsContext);
  }
}
