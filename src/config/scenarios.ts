export interface Scenario {
  id: 'pitch' | 'planning' | 'focus';
  title: string;
  description: string;
  isActive: boolean;
  participantCount: number;
  accentColor: string;
}

export const scenarios: Scenario[] = [
  {
    id: 'focus',
    title: 'Run a focus group',
    description: 'Gather feedback on a concept, product, or prototype with a guided panel',
    isActive: true,
    participantCount: 3,
    accentColor: 'bg-primary',
  },
  {
    id: 'pitch',
    title: 'Pitch to a client',
    description: 'Get feedback on your ideas, proposal, or presentation before the real thing',
    isActive: true,
    participantCount: 3,
    accentColor: 'bg-primary',
  },
  {
    id: 'planning',
    title: 'Plan work with your team',
    description: 'Plan ahead and brainstorm solutions with colleagues and experts in your field',
    isActive: false,
    participantCount: 3,
    accentColor: 'bg-gray-300',
  },
];
