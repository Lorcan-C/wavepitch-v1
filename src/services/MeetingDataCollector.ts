import { MeetingData } from '../hooks/useClerkSupabase';
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
    title: string,
  ): Promise<MeetingSummary> {
    // TODO: Replace with real summary generation
    return {
      keyIdeas: [`Discussion about: ${title}`],
      strategicQuestions: [],
      decisions: [],
    };
  }

  static convertToMeetingData(meetingData: CompleteMeetingData): MeetingData {
    return {
      meetingId: meetingData.meetingId,
      meetingTitle: meetingData.title,
      participants: meetingData.participants,
      messages: meetingData.messages,
      meetingStartTime: meetingData.startTime,
      meetingEndTime: meetingData.endTime,
      sessionId: meetingData.sessionId,
    };
  }
}
