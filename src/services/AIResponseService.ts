import { Message } from '@/meetings/types';

export interface AgentContext {
  agentName: string;
  agentRole: string;
  agentBio: string;
  meetingPurpose: string;
}

export interface AIResponseContext {
  sessionId: string;
  userMessage: Message;
  agentContext: AgentContext;
  meetingTranscript?: string;
}

export interface AIResponseResult {
  messageId: string;
  response: Response;
}

export class AIResponseService {
  static async generateResponse(context: AIResponseContext): Promise<AIResponseResult> {
    const messageId = Date.now().toString();

    const response = await fetch('/api/ai/generateresponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: context.userMessage.content,
        agentName: context.agentContext.agentName,
        agentRole: context.agentContext.agentRole,
        agentBio: context.agentContext.agentBio,
        meetingPurpose: context.agentContext.meetingPurpose,
        meetingTranscript: context.meetingTranscript,
      }),
    });

    return {
      messageId,
      response,
    };
  }
}
