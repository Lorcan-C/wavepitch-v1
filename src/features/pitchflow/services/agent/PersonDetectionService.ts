
import { serviceRegistry } from '../ServiceRegistry';
import { langfuseService } from '../langfuseService';

export interface DetectedPerson {
  name: string;
  role: string;
  relationship: string; // "my accountant", "our HR director", etc.
  expertise: string;
  description: string;
  originalMention: string; // The exact phrase from the prompt
}

export interface PersonDetectionResult {
  detectedPeople: DetectedPerson[];
  hasSpecificPeople: boolean;
  remainingSlots: number; // How many perspective agents we need to generate
}

export class PersonDetectionService {
  static async detectPeopleInPrompt(prompt: string, userRole?: string): Promise<PersonDetectionResult> {
    try {
      console.log('PersonDetectionService: Analyzing prompt for specific people:', prompt);
      
      const aiService = serviceRegistry.getTextGenerationService();
      
      const promptData = await langfuseService.getPrompt('person-detection-analyze-request');
      const detectionPrompt = promptData.compile({
        prompt,
        userRole: userRole || ''
      });
      
      const response = await aiService.generateText([
        { role: 'user', content: detectionPrompt }
      ], { temperature: 0.3, maxOutputTokens: 500 });

      console.log('PersonDetectionService: Raw AI response:', response);

      // Parse the JSON response (handle both raw JSON and markdown-wrapped JSON)
      let jsonStr = response;
      
      // First try to extract from markdown code block
      const markdownMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        jsonStr = markdownMatch[1];
      } else {
        // Fall back to extracting raw JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.log('PersonDetectionService: No JSON found in response, assuming no specific people');
          return this.createEmptyResult();
        }
        jsonStr = jsonMatch[0];
      }

      const parsedResult = JSON.parse(jsonStr);
      
      if (!parsedResult.people || !Array.isArray(parsedResult.people)) {
        console.log('PersonDetectionService: Invalid response format, assuming no specific people');
        return this.createEmptyResult();
      }

      const detectedPeople: DetectedPerson[] = parsedResult.people
        .filter((person: any) => person && person.name && person.role)
        .slice(0, 3) // Maximum 3 people
        .map((person: any) => ({
          name: person.name || 'Professional',
          role: person.role || 'Expert',
          relationship: person.relationship || '',
          expertise: person.expertise || 'Professional expertise',
          description: person.description || 'Professional expert in their field',
          originalMention: person.originalMention || ''
        }));

      const remainingSlots = Math.max(0, 3 - detectedPeople.length);

      console.log(`PersonDetectionService: Detected ${detectedPeople.length} specific people, ${remainingSlots} remaining slots`);
      
      return {
        detectedPeople,
        hasSpecificPeople: detectedPeople.length > 0,
        remainingSlots
      };

    } catch (error) {
      console.error('PersonDetectionService: Error detecting people:', error);
      return this.createEmptyResult();
    }
  }


  private static createEmptyResult(): PersonDetectionResult {
    return {
      detectedPeople: [],
      hasSpecificPeople: false,
      remainingSlots: 3
    };
  }
}
