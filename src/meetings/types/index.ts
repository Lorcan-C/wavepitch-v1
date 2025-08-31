export interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: 'purple' | 'blue' | 'pink' | 'green' | 'yellow' | 'red' | string;
  description: string;
  isUser?: boolean;
  isSpeaking?: boolean;
  isNextToSpeak?: boolean;
  isListening?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: 'blue';
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  isUser: boolean;
  timestamp: number;
  senderName?: string;
  userId?: string;
  messageType?: 'intro' | 'regular' | 'conclusion';
  speakerTurn?: number;
  isAnimated?: boolean;
  isTyping?: boolean;
  conversationId?: string;
  audioUrl?: string;
  aiGeneration?: {
    generationSuccess: boolean;
    retryCount: number;
    tokenCount: number;
    promptUsed: string;
    chainOfThoughtAnalysis?: string;
  };
}

export interface SpeakerQueueItem {
  id: string;
  name: string;
  avatar: string;
  position: number;
}

export type SpeakingState = 'current' | 'next' | 'waiting' | 'user';

export interface ExpertApiData {
  id?: string;
  name?: string;
  role?: string;
  expertise?: string;
  bio?: string;
  description?: string;
  avatar?: string;
  color?: 'purple' | 'blue' | 'pink' | 'green' | 'yellow' | 'red' | string;
}

export interface MeetingSummary {
  keyIdeas: string[];
  strategicQuestions: string[];
  decisions: string[];
}

export interface MeetingSummaryState {
  summary: MeetingSummary | null;
  isGenerating: boolean;
  error: string | null;
  generatedAt: string | null;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
