import { Agent } from '../../../../shared/types/agent';

// TODO: Import expertTypes from constants or create proper config
const expertTypes = [
  { name: 'Big-picture Strategy', description: 'Strategic thinking and long-term planning' },
  { name: 'Practical Implementation', description: 'Tactical execution and step-by-step guidance' },
  { name: 'Creative Problem Solving', description: 'Innovative solutions and creative thinking' }
];
import { PromptGenerationService } from './PromptGenerationService';
import { AgentCreationService } from './AgentCreationService';
import { FallbackAgentService } from './FallbackAgentService';
import { ContextDetectionService } from './ContextDetectionService';
import { PersonDetectionService, DetectedPerson } from './PersonDetectionService';

interface SmartAgentSuggestion {
  name: string;
  role: string;
  expertise: string;
  description: string;
}

interface ProgressCallback {
  (progress: number, step: string): void;
}

interface GenerationContext {
  originalTopic: string;
  userRole?: string;
  contextType: 'workplace' | 'personal-workplace' | 'general';
  expertType: string;
  relationshipToUser?: string;
  promptUsed?: string;
  isSpecificPerson?: boolean; // New field to track if this was a detected person
}

export class SmartAgentOrchestrator {
  static async generateSmartAgentSuggestions(
    topic: string,
    userRole?: string,
    onProgress?: ProgressCallback
  ): Promise<Agent[]> {
    if (!topic || topic.trim().length < 3) {
      return FallbackAgentService.getDefaultExpertSuggestions();
    }

    try {
      console.log('SmartAgentOrchestrator: Starting hybrid person + perspective generation for topic:', topic, 'role:', userRole);
      const startTime = Date.now();
      
      onProgress?.(10, 'Analyzing for specific people mentioned...');
      
      // Step 1: Detect specific people mentioned in the prompt
      const personDetectionResult = await PersonDetectionService.detectPeopleInPrompt(topic, userRole);
      console.log('SmartAgentOrchestrator: Person detection result:', personDetectionResult);
      
      // Use new narrative context analysis
      const narrativeAnalysis = await ContextDetectionService.analyzeContextNarrative(topic, userRole);
      const contextType = narrativeAnalysis ? narrativeAnalysis.contextType : 'general';
      
      const successfulExperts: SmartAgentSuggestion[] = [];
      const generationContexts: GenerationContext[] = [];
      const failures: number[] = [];
      
      let currentProgress = 20;
      const progressIncrement = 60 / 3; // 60% of progress divided by 3 agents
      
      // Step 2: Generate agents for detected people first
      if (personDetectionResult.hasSpecificPeople) {
        onProgress?.(currentProgress, `Generating ${personDetectionResult.detectedPeople.length} specific people...`);
        
        for (let i = 0; i < personDetectionResult.detectedPeople.length; i++) {
          const person = personDetectionResult.detectedPeople[i];
          
          try {
            const personAgent = await this.generatePersonAgent(person, topic, userRole, contextType);
            if (personAgent) {
              successfulExperts.push(personAgent);
              
              const generationContext: GenerationContext = {
                originalTopic: topic,
                userRole,
                contextType,
                expertType: 'Specific Person',
                relationshipToUser: person.relationship,
                promptUsed: `Generate agent for specific person: ${person.originalMention}`,
                isSpecificPerson: true
              };
              generationContexts.push(generationContext);
              
              console.log(`SmartAgentOrchestrator: Successfully generated person agent: ${personAgent.name}`);
            } else {
              failures.push(successfulExperts.length);
              console.warn(`SmartAgentOrchestrator: Failed to generate agent for person: ${person.name}`);
            }
          } catch (error) {
            failures.push(successfulExperts.length);
            console.warn(`SmartAgentOrchestrator: Error generating agent for person ${person.name}:`, error);
          }
          
          currentProgress += progressIncrement / 2;
          onProgress?.(currentProgress, `Generated agent for ${person.name}...`);
        }
      }
      
      // Step 3: Fill remaining slots with complementary perspective agents
      const remainingSlots = personDetectionResult.remainingSlots;
      if (remainingSlots > 0) {
        const complementaryTypes = this.selectComplementaryPerspectives(remainingSlots, personDetectionResult.detectedPeople);
        
        onProgress?.(currentProgress, `Generating ${remainingSlots} complementary perspective agents...`);
        
        for (let i = 0; i < complementaryTypes.length; i++) {
          const expertType = complementaryTypes[i];
          const prompt = await PromptGenerationService.createComplementaryPrompt(
            topic,
            userRole || '',
            expertType,
            successfulExperts,
            personDetectionResult.detectedPeople
          );
          
          try {
            // Pass attempt number for dynamic temperature
            const expert = await AgentCreationService.generateSingleExpert(prompt, 20000, i);
            
            if (expert) {
              successfulExperts.push(expert);
              
              const generationContext: GenerationContext = {
                originalTopic: topic,
                userRole,
                contextType,
                expertType: expertType.name,
                relationshipToUser: contextType === 'personal-workplace' ? this.getDefaultRelationship(successfulExperts.length - 1) : undefined,
                promptUsed: prompt,
                isSpecificPerson: false
              };
              generationContexts.push(generationContext);
              
              console.log(`SmartAgentOrchestrator: Successfully generated perspective agent: ${expert.name} - ${expert.role}`);
            } else {
              failures.push(successfulExperts.length);
              console.warn(`SmartAgentOrchestrator: Failed to generate perspective agent ${i + 1}`);
            }
          } catch (error) {
            failures.push(successfulExperts.length);
            console.warn(`SmartAgentOrchestrator: Error generating perspective agent ${i + 1}:`, error);
          }
          
          currentProgress += progressIncrement / 2;
          onProgress?.(currentProgress, `Generated ${expertType.name} perspective agent...`);
        }
      }
      
      // Step 4: Fill any remaining slots with fallbacks
      while (successfulExperts.length < 3) {
        const fallbackExperts = userRole 
          ? FallbackAgentService.getRoleBasedFallback(topic, userRole) 
          : FallbackAgentService.getDefaultExpertSuggestions();
          
        const fallbackAgent = fallbackExperts[successfulExperts.length];
        if (fallbackAgent) {
          successfulExperts.push({
            name: fallbackAgent.name,
            role: fallbackAgent.role || 'Expert',
            expertise: fallbackAgent.expertise || 'General expertise',
            description: fallbackAgent.description || 'Professional expert in their field'
          });
          
          const fallbackContext: GenerationContext = {
            originalTopic: topic,
            userRole,
            contextType: 'general',
            expertType: 'Fallback',
            isSpecificPerson: false
          };
          generationContexts.push(fallbackContext);
        } else {
          break;
        }
      }
      
      onProgress?.(100, 'Finalizing your expert team...');
      
      const endTime = Date.now();
      console.log(`SmartAgentOrchestrator: Hybrid generation completed in ${endTime - startTime}ms`);
      console.log(`SmartAgentOrchestrator: Generated ${personDetectionResult.detectedPeople.length} specific people + ${remainingSlots} perspectives`);
      
      // Convert to agents and store in batch with enhanced context
      return await AgentCreationService.convertAndStoreBatch(successfulExperts.slice(0, 3), generationContexts.slice(0, 3));
      
    } catch (error) {
      console.error('Error in hybrid person + perspective agent generation:', error);
      return userRole 
        ? FallbackAgentService.getRoleBasedFallback(topic, userRole) 
        : FallbackAgentService.getTopicBasedFallback(topic);
    }
  }
  
  private static async generatePersonAgent(
    person: DetectedPerson, 
    topic: string, 
    userRole?: string, 
    contextType?: string
  ): Promise<SmartAgentSuggestion | null> {
    const prompt = PromptGenerationService.createPersonSpecificPrompt(person, topic, userRole, contextType);
    return await AgentCreationService.generateSingleExpert(prompt, 20000);
  }
  
  private static selectComplementaryPerspectives(remainingSlots: number, detectedPeople: DetectedPerson[]): any[] {
    // If we have 3 remaining slots and no people, use all 3 perspectives
    if (remainingSlots === 3) {
      return expertTypes;
    }
    
    // If we have fewer slots, prioritize perspectives that complement the detected people
    const availablePerspectives = [...expertTypes];
    const selectedPerspectives = [];
    
    // Analyze what types of expertise we already have from detected people
    const existingExpertiseTypes = detectedPeople.map(person => 
      this.categorizePersonExpertise(person.expertise || person.role)
    );
    
    // Select complementary perspectives
    for (let i = 0; i < remainingSlots && i < availablePerspectives.length; i++) {
      const perspective = availablePerspectives[i];
      selectedPerspectives.push(perspective);
    }
    
    return selectedPerspectives;
  }
  
  private static categorizePersonExpertise(expertise: string): string {
    const lowerExpertise = expertise.toLowerCase();
    
    if (lowerExpertise.includes('strategic') || lowerExpertise.includes('executive') || lowerExpertise.includes('director')) {
      return 'strategic';
    } else if (lowerExpertise.includes('practical') || lowerExpertise.includes('operational') || lowerExpertise.includes('manager')) {
      return 'practical';
    } else if (lowerExpertise.includes('creative') || lowerExpertise.includes('innovative') || lowerExpertise.includes('design')) {
      return 'creative';
    }
    
    return 'general';
  }
  
  private static determineContextType(contextAnalysis: any): 'workplace' | 'personal-workplace' | 'general' {
    if (contextAnalysis.isWorkplace && contextAnalysis.isPersonal) {
      return 'personal-workplace';
    } else if (contextAnalysis.isWorkplace) {
      return 'workplace';
    }
    return 'general';
  }
  
  private static extractRelationshipFromPrompt(prompt: string, contextType: 'workplace' | 'personal-workplace' | 'general'): string | undefined {
    if (contextType !== 'personal-workplace') return undefined;
    
    if (prompt.includes('YOUR direct manager') || prompt.includes('your manager')) {
      return 'your direct manager';
    } else if (prompt.includes('YOUR peer') || prompt.includes('your colleague')) {
      return 'your peer/colleague';
    } else if (prompt.includes('YOUR HR') || prompt.includes('your mentor')) {
      return 'your HR representative/mentor';
    }
    
    return undefined;
  }
  
  private static getDefaultRelationship(expertIndex: number): string {
    const relationships = [
      'your direct manager',
      'your peer/colleague', 
      'your HR representative'
    ];
    return relationships[expertIndex] || 'your workplace contact';
  }
}
