export interface Participant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: 'purple' | 'blue' | 'pink' | 'green' | 'yellow' | 'red';
  description?: string;
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
}
