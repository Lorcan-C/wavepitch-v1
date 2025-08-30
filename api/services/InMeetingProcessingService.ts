import { generateText, streamText } from 'ai';

import { DEFAULT_TEXT_MODEL } from '../../src/lib/ai';
import { MeetingContextService } from '../../src/services/MeetingContextService';
import { getLangfusePrompt } from '../lib/langfuse';

interface MeetingContext {
  experts: Array<{
    id: string;
    name: string;
    role: string;
    expertise: string;
  }>;
  meetingContext: string;
  currentPhase?: string;
}

export interface InMeetingProcessingResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    processingTime: number;
    aiProvider: string;
  };
}

export class InMeetingProcessingService {
  /**
   * Generate response for in-meeting conversation
   */
  static async generateResponse(
    sessionId: string,
    expertId: string,
    conversationHistory: Array<{
      isUser: boolean;
      sender: string;
      message: string;
      timestamp: number;
    }>,
    currentPhase: string,
    userMessage: string,
  ): Promise<InMeetingProcessingResult> {
    const startTime = Date.now();

    try {
      // Validate context and expert
      const validation = MeetingContextService.validateContextAndExpert(sessionId, expertId);

      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid context or expert');
      }

      // Get context prompt from Langfuse
      const contextPrompt = await getLangfusePrompt('in-meeting-response');

      // Build conversation context (last 10 messages for performance)
      const recentHistory = conversationHistory.slice(-10);

      // Format context as JSON for OpenAI
      const contextJson = MeetingContextService.formatContextForAI(
        validation.context!,
        validation.expert!,
        recentHistory,
        currentPhase || 'discussion',
        userMessage || '',
      );

      const prompt = contextPrompt.compile({
        contextJson,
      });

      // Generate response with streaming
      const stream = await streamText({
        model: DEFAULT_TEXT_MODEL,
        prompt: prompt,
        temperature: 0.7,
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: stream,
        metadata: {
          processingTime,
          aiProvider: 'openai-gpt-4o',
        },
      };
    } catch (error) {
      console.error('InMeetingProcessingService: Response generation failed:', error);
      throw error;
    }
  }

  /**
   * Advance to next speaker
   */
  static async advanceSpeaker(
    sessionId: string,
    currentSpeaker: string,
  ): Promise<InMeetingProcessingResult> {
    const startTime = Date.now();

    try {
      const meetingContext = MeetingContextService.getContext(sessionId);

      if (!meetingContext) {
        throw new Error('Meeting context not found');
      }

      // Simple round-robin for MVP
      const currentIndex = meetingContext.experts.findIndex((e) => e.id === currentSpeaker);
      const nextIndex = (currentIndex + 1) % meetingContext.experts.length;
      const nextSpeaker = meetingContext.experts[nextIndex];

      // Get transition prompt from Langfuse
      const transitionPrompt = await getLangfusePrompt('speaker-transition');

      // Pre-generate next response
      const preGeneratedResponse = await generateText({
        model: DEFAULT_TEXT_MODEL,
        prompt: transitionPrompt.compile({
          expertName: nextSpeaker.name,
          expertRole: nextSpeaker.role,
          expertise: nextSpeaker.expertise,
          meetingContext: meetingContext.meetingContext,
        }),
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          nextSpeaker: nextSpeaker.id,
          nextSpeakerName: nextSpeaker.name,
          preGeneratedResponse: preGeneratedResponse.text,
          phase: meetingContext.currentPhase || 'discussion',
        },
        metadata: {
          processingTime,
          aiProvider: 'openai-gpt-4o',
        },
      };
    } catch (error) {
      console.error('InMeetingProcessingService: Speaker advancement failed:', error);
      throw error;
    }
  }

  /**
   * Update meeting context
   */
  static updateContext(
    sessionId: string,
    updates: Partial<MeetingContext>,
  ): InMeetingProcessingResult {
    try {
      MeetingContextService.updateContext(sessionId, updates);
      return {
        success: true,
        data: { message: 'Context updated successfully' },
      };
    } catch (error) {
      console.error('InMeetingProcessingService: Context update failed:', error);
      throw error;
    }
  }
}
