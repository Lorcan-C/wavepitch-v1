import { Message, User } from '@/meetings/types';

export class MessageCommitService {
  static createUserMessage(content: string, user: User): Message {
    return {
      id: Date.now().toString(),
      content,
      sender: user.id,
      isUser: true,
      timestamp: Date.now(),
      senderName: user.name,
    };
  }

  static commitMessage(content: string, user: User, currentMessages: Message[]): Message[] {
    const userMessage = this.createUserMessage(content, user);
    return [...currentMessages, userMessage];
  }
}
