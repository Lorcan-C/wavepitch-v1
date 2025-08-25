
// This file is automatically created to define the Agent type
export interface Agent {
  id: string;
  name: string;
  type?: string;
  avatar_url?: string;
  description?: string;
  color?: string;
  role?: string;
  avatar?: string;
  source?: 'prebuilt' | 'custom';
  tone?: string;
  style?: string;
  expertise?: string; // Added to fix compatibility with SmartAgentSuggestion
  originalDescription?: string; // Store original description for debugging/transparency
  
  // Enhanced fields for better context retention
  relationshipToUser?: string; // "your direct manager", "your peer", etc.
  communicationStyle?: 'standard' | 'bluf' | string; // Communication preferences
  generationContext?: {
    originalTopic: string;
    userRole?: string;
    contextType: 'workplace' | 'personal-workplace' | 'general';
    expertType: string; // "Big-picture", "Practical", "Creative"
    isSpecificPerson?: boolean; // Whether this was a detected specific person
  };
  enhancedProfile?: {
    background?: string;
    specialization?: string;
    workingStyle?: string;
    decisionMakingAuthority?: string;
    yearsOfExperience?: string;
    personalityTraits?: {
      communicationStyle?: string;
      decisionMakingApproach?: string;
      meetingBehavior?: string;
      workingStyle?: string;
      personalityQuirks?: string;
      conversationTriggers?: string;
      conflictStyle?: string;
    };
  };
  aiMetadata?: {
    generatedAt: string;
    promptUsed?: string;
    generationSuccess: boolean;
  };
}
