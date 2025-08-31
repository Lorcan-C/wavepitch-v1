import { Message } from '@/meetings/types';

export interface AIResponseContext {
  sessionId: string;
  userMessage: Message;
}

export interface AIResponseResult {
  messageId: string;
  response: Response;
}

export class AIResponseService {
  static async generateResponse(context: AIResponseContext): Promise<AIResponseResult> {
    const messageId = Date.now().toString();

    const response = await fetch('/api/messages/in-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: context.sessionId,
        type: 'generate-response',
        messageId,
        userMessage: context.userMessage.content,
      }),
    });

    return {
      messageId,
      response,
    };
  }
}
