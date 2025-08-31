import { MeetingSummary, Message } from '../meetings/types';

export class MeetingSummaryService {
  static async generateSummary(messages: Message[], meetingTitle: string): Promise<MeetingSummary> {
    if (messages.length === 0) {
      return {
        keyIdeas: [],
        strategicQuestions: [],
        decisions: [],
      };
    }

    try {
      const conversationText = this.formatMessagesForAnalysis(messages);

      const response = await fetch('/api/ai/generate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptName: 'meeting_summary_ai_prompt',
          variables: {
            meetingTitle,
            conversationText,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.topic) {
        throw new Error('Invalid response from AI service');
      }

      const summary = JSON.parse(result.topic);

      return {
        keyIdeas: Array.isArray(summary.keyIdeas) ? summary.keyIdeas : [],
        strategicQuestions: Array.isArray(summary.strategicQuestions)
          ? summary.strategicQuestions
          : [],
        decisions: Array.isArray(summary.decisions) ? summary.decisions : [],
      };
    } catch (error) {
      console.error('Failed to generate meeting summary:', error);
      return {
        keyIdeas: [`Error generating summary for: ${meetingTitle}`],
        strategicQuestions: [],
        decisions: [],
      };
    }
  }

  private static formatMessagesForAnalysis(messages: Message[]): string {
    return messages
      .filter((msg) => msg.content.trim().length > 0)
      .filter((msg) => msg.messageType !== 'intro' || msg.content.length > 50)
      .map((msg) => {
        const speaker = msg.senderName || msg.sender;
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        return `[${timestamp}] ${speaker}: ${msg.content}`;
      })
      .join('\n');
  }
}
