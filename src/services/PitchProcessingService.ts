import { generateObject, generateText } from 'ai';
import { z } from 'zod';

import { DEFAULT_TEXT_MODEL } from '../lib/ai';
import { getLangfusePrompt } from '../lib/langfuse';
import {
  type MeetingSetup,
  MeetingSetupSchema,
  type PitchContext,
} from './pitch-processing/validation';

export interface PitchProcessingResult {
  processedContext: PitchContext;
  meetingData: MeetingSetup;
  metadata: {
    processingTime: number;
    aiProvider: string;
    qualityScore: number;
  };
}

export class PitchProcessingService {
  // Cache for Langfuse prompts to avoid repeated fetches
  private static promptCache = new Map<
    string,
    { compile: (data: Record<string, string>) => string } | null
  >();

  /**
   * Get cached Langfuse prompt
   */
  private static async getLangfusePromptCached(name: string) {
    if (!this.promptCache.has(name)) {
      try {
        const prompt = await getLangfusePrompt(name);
        this.promptCache.set(name, prompt);
      } catch {
        this.promptCache.set(name, null);
      }
    }
    return this.promptCache.get(name);
  }
  /**
   * Main processing method using Langfuse prompts
   */
  static async processPitchFlow(
    pitchDescription: string,
    meetingType: string = 'pitch',
    documents: Array<{ filename: string; content?: string }> = [],
  ): Promise<PitchProcessingResult> {
    const startTime = Date.now();

    try {
      // Step 1: Get meeting setup prompt only (skip pitch analysis)
      const meetingSetupPrompt = await this.getLangfusePromptCached('enhanced-meeting-setup');

      // Step 2: Generate meeting setup using existing Langfuse prompt
      if (!meetingSetupPrompt) {
        throw new Error('Meeting setup prompt not available');
      }

      const meetingSetup = await generateObject({
        model: DEFAULT_TEXT_MODEL,
        schema: MeetingSetupSchema,
        prompt: meetingSetupPrompt.compile({
          pitchDescription,
          meetingType,
          documents: documents
            .map((doc) => `${doc.filename}: ${doc.content?.slice(0, 500)}`)
            .join('\n'),
        }),
      });

      // Step 3: Create context from meeting setup data
      const processedContext = this.createContextFromMeetingSetup(
        pitchDescription,
        meetingSetup.object,
      );

      const processingTime = Date.now() - startTime;

      return {
        processedContext,
        meetingData: meetingSetup.object,
        metadata: {
          processingTime,
          aiProvider: 'openai-gpt-4o',
          qualityScore: this.calculateQualityScore(meetingSetup.object.experts),
        },
      };
    } catch (error) {
      console.error('PitchProcessingService: Processing failed:', error);
      throw error;
    }
  }

  /**
   * Create context from meeting setup data
   */
  private static createContextFromMeetingSetup(
    pitchDescription: string,
    meetingSetup: z.infer<typeof MeetingSetupSchema>,
  ): PitchContext {
    return {
      topic: meetingSetup.meetingContext,
      opportunity: pitchDescription.slice(0, 200),
      stakeholders: meetingSetup.experts.map((expert) => ({
        name: expert.name,
        role: expert.role,
        relationship: 'meeting participant',
        mentioned_as: expert.name,
        involvement_level: 'high' as const,
      })),
      context: 'pitch' as const,
      user_role: 'presenter',
      key_points: [meetingSetup.meetingPurpose],
      meeting_goal: meetingSetup.meetingPurpose,
      urgency: 'medium' as const,
      preparation_notes: `Meeting with ${meetingSetup.experts.length} experts`,
    };
  }

  /**
   * Calculate quality score based on generated content
   */
  private static calculateQualityScore(
    experts: Array<{ name: string; role: string; bio: string }>,
  ): number {
    let score = 0;

    // Expert quality scoring
    experts.forEach((expert) => {
      if (expert.name && expert.name.length > 2) score += 10;
      if (expert.role && expert.role.length > 3) score += 10;
      if (expert.bio && expert.bio.length > 20) score += 15;
    });

    // Base score for having experts
    if (experts.length >= 3) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Health check for service
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, unknown>;
  }> {
    try {
      const testResult = await generateText({
        model: DEFAULT_TEXT_MODEL,
        prompt: 'Test message for health check',
      });

      return {
        status: 'healthy',
        details: {
          aiProvider: 'openai-gpt-4o',
          responseLength: testResult.text.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
