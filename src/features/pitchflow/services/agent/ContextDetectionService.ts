
import { serviceRegistry } from '../ServiceRegistry';

export interface ContextTypes {
  isWorkplace: boolean;
  isPersonal: boolean;
  isEducation: boolean;
  isHealthcare: boolean;
  isFinance: boolean;
}

export interface ContextAnalysis {
  primaryCategory: string;
  contextType: 'workplace' | 'personal-workplace' | 'general';
  isPersonal: boolean;
  situationType: string;
  relevantHelp: string;
}

export class ContextDetectionService {
  // Keep existing methods for backward compatibility
  private static workplaceKeywords = [
    'manager', 'boss', 'supervisor', 'my manager', 'my boss',
    'colleague', 'coworker', 'team member', 'peer',
    'hr', 'human resources', 'direct report',
    'salary', 'raise', 'promotion', 'performance review',
    'team meeting', 'work discussion', 'office',
    'company', 'workplace', 'organization'
  ];

  private static personalKeywords = [
    'my ', 'i ', 'me ', 'myself',
    'my manager', 'my boss', 'my team', 'my salary', 'my performance',
    'my promotion', 'my raise', 'my colleague', 'my work',
    'i need', 'i want', 'i should', 'i have', 'i am',
    'help me', 'advice for me', 'what should i'
  ];

  private static educationKeywords = [
    'student', 'teacher', 'professor', 'school', 'university',
    'education', 'learning', 'study', 'curriculum', 'academic'
  ];

  private static healthcareKeywords = [
    'patient', 'doctor', 'medical', 'health', 'hospital',
    'treatment', 'diagnosis', 'healthcare', 'clinical'
  ];

  private static financeKeywords = [
    'investment', 'budget', 'financial', 'money', 'banking',
    'portfolio', 'insurance', 'loan', 'credit', 'savings'
  ];

  static detectWorkplaceContext(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return this.workplaceKeywords.some(keyword => lowerTopic.includes(keyword));
  }

  static detectPersonalContext(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return this.personalKeywords.some(keyword => lowerTopic.includes(keyword));
  }

  static detectEducationContext(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return this.educationKeywords.some(keyword => lowerTopic.includes(keyword));
  }

  static detectHealthcareContext(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return this.healthcareKeywords.some(keyword => lowerTopic.includes(keyword));
  }

  static detectFinanceContext(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return this.financeKeywords.some(keyword => lowerTopic.includes(keyword));
  }

  static analyzeContext(topic: string): ContextTypes {
    return {
      isWorkplace: this.detectWorkplaceContext(topic),
      isPersonal: this.detectPersonalContext(topic),
      isEducation: this.detectEducationContext(topic),
      isHealthcare: this.detectHealthcareContext(topic),
      isFinance: this.detectFinanceContext(topic)
    };
  }

  // New narrative-based context analysis
  static async analyzeContextNarrative(topic: string, userRole?: string): Promise<ContextAnalysis | null> {
    try {
      const prompt = `Analyze this situation and determine what type of help would be most valuable:

SITUATION: "${topic}"
USER ROLE: ${userRole || 'not specified'}

Please analyze:
1. What type of situation is this person describing?
2. Is this workplace-related, personal, or general?
3. What kind of help or expertise would be most valuable?

Respond in this exact JSON format:
{
  "primaryCategory": "[workplace/education/finance/healthcare/travel/hobby/personal-development/creative/business/family/other]",
  "contextType": "[workplace/personal-workplace/general]",
  "isPersonal": true/false,
  "situationType": "[brief description like 'career discussion', 'trip planning', 'hobby pursuit', etc.]",
  "relevantHelp": "[what type of expertise or perspectives would be most helpful]"
}`;

      const aiService = serviceRegistry.getTextGenerationService();
      const response = await aiService.generateText([
        { role: 'user', content: prompt }
      ], { temperature: 0.3, maxOutputTokens: 200 });

      if (!response) {
        console.warn('ContextDetectionService: Empty response from narrative analysis');
        return null;
      }

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('ContextDetectionService: No JSON found in narrative analysis response');
        return null;
      }

      const analysis = JSON.parse(jsonMatch[0]);
      console.log('ContextDetectionService: Narrative analysis result:', analysis);
      return analysis;

    } catch (error) {
      console.error('ContextDetectionService: Error in narrative analysis:', error);
      return null;
    }
  }
}
