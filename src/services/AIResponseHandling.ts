import { Message } from '@/meetings/types';

export class AIResponseHandling {
  static async processResponse(
    response: Response, 
    expertId: string, 
    expertName: string
  ): Promise<Message> {
    try {
      const data = await response.json();
      const fullText = data.text;
      
      // Extract just the [Reply] section after #####
      const replySection = fullText.split('#####')[1];
      const nextReply = replySection.replace('[Reply]', '').trim();
      
      console.log('AIResponseHandling: Response extracted successfully');
      
      // Create Message object
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: nextReply,
        sender: expertId,
        isUser: false,
        timestamp: Date.now(),
        senderName: expertName,
      };
      
      return aiMessage;
    } catch (error) {
      console.error('AI response processing failed:', error);
      throw new Error("Sorry, the response service is currently experiencing some difficulties.");
    }
  }
}