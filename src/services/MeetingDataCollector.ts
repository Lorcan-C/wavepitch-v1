import { MeetingSummary, Message, Participant } from '../meetings/types';

export interface CompleteMeetingData {
  meetingId: string;
  sessionId: string;
  title: string;
  participants: Participant[];
  messages: Message[];
  startTime: string;
  endTime: string;
  duration: number;
  summary: MeetingSummary;
}

export class MeetingDataCollector {
  static async collect(
    meetingId: string,
    sessionId: string,
    title: string,
    participants: Participant[],
    messages: Message[],
    startTime: string,
    endTime?: string,
  ): Promise<CompleteMeetingData> {
    const actualEndTime = endTime || new Date().toISOString();
    const duration = Math.round(
      (new Date(actualEndTime).getTime() - new Date(startTime).getTime()) / (1000 * 60),
    );

    console.log(
      `Collecting data for meeting ${meetingId}: ${messages.length} messages, ${participants.length} participants`,
    );

    const summary = await this.generateSummary(messages, title);

    return {
      meetingId,
      sessionId,
      title,
      participants,
      messages,
      startTime,
      endTime: actualEndTime,
      duration,
      summary,
    };
  }

  private static async generateSummary(
    _messages: Message[],
    _title: string,
  ): Promise<MeetingSummary> {
    // TODO: Replace with real summary generation
    return {
      keyIdeas: [`Discussion about: ${_title}`],
      strategicQuestions: [],
      decisions: [],
    };
  }

  static async saveToSupabase(meetingData: CompleteMeetingData, userId: string): Promise<boolean> {
    try {
      console.log('Calling Edge Function to save conversation');

      const response = await fetch('/api/conversations/savemeeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meetingData,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to save conversation:', error);
      return false;
    }
  }
}
