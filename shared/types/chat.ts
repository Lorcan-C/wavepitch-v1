
export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

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
  expertise?: string;
  originalDescription?: string;
  
  // Enhanced fields for better context retention
  relationshipToUser?: string;
  communicationStyle?: 'standard' | 'bluf' | string;
  generationContext?: {
    originalTopic: string;
    userRole?: string;
    contextType: 'workplace' | 'personal-workplace' | 'general';
    expertType: string;
    isSpecificPerson?: boolean;
  };
  enhancedProfile?: {
    background?: string;
    specialization?: string;
    workingStyle?: string;
    decisionMakingAuthority?: string;
    yearsOfExperience?: string;
  };
  aiMetadata?: {
    generatedAt: string;
    promptUsed?: string;
    generationSuccess: boolean;
  };
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  isUser: boolean;
  userId?: string;
  messageType?: 'intro' | 'regular' | 'conclusion';
  speakerTurn?: number;
  isAnimated?: boolean;
  isTyping?: boolean;
  conversationId?: string;
  aiGeneration?: {
    generationSuccess: boolean;
    retryCount: number;
    tokenCount: number;
    promptUsed: string;
    chainOfThoughtAnalysis?: string;
  };
}

export interface ConversationData {
  id: string;
  title: string;
  participants: string[]; // Changed from Agent[] to string[] to match actual usage
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  meetingType?: string;
  meetingGoal?: string;
}

// Add Conversation as an alias for ConversationData to maintain compatibility
export type Conversation = ConversationData;
