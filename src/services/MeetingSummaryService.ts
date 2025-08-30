import { generateText } from 'ai';

import { DEFAULT_TEXT_MODEL } from '../lib/ai';
import { getLangfusePrompt } from '../lib/langfuse';
import { MeetingSummary, Message } from '../meetings/types';

export class MeetingSummaryService {
  private static instance: MeetingSummaryService;

  static getInstance(): MeetingSummaryService {
    if (!this.instance) {
      this.instance = new MeetingSummaryService();
    }
    return this.instance;
  }

  private convertMessagesToSummaryFormat(messages: Message[]): string {
    return messages
      .map((msg) => {
        const speaker = msg.isUser ? 'User' : `${msg.senderName || msg.sender}`;
        return `[${speaker}]: ${msg.content}`;
      })
      .join('\n\n');
  }

  public async generateMeetingSummary(messages: Message[]): Promise<MeetingSummary> {
    if (messages.length === 0) {
      return {
        keyIdeas: [],
        strategicQuestions: [],
        decisions: [],
      };
    }

    try {
      const conversationText = this.convertMessagesToSummaryFormat(messages);
      const summaryPrompt = await getLangfusePrompt('meeting-summary-generation');

      const prompt = summaryPrompt.compile({ conversation: conversationText });
      const config = summaryPrompt.config || {};

      const { text } = await generateText({
        model: DEFAULT_TEXT_MODEL,
        prompt,
        ...config,
      });

      // Extract JSON from response
      let jsonStr = text.trim();
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      }

      const summary: MeetingSummary = JSON.parse(jsonStr);

      // Validate structure
      if (!summary.keyIdeas || !summary.strategicQuestions || !summary.decisions) {
        throw new Error('Invalid summary structure');
      }

      return summary;
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      return {
        keyIdeas: ['Failed to generate key ideas'],
        strategicQuestions: ['Unable to identify strategic questions'],
        decisions: ['Summary generation encountered an error'],
      };
    }
  }
}

export const meetingSummaryService = MeetingSummaryService.getInstance();
