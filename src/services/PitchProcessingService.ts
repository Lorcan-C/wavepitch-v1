import { generateObject, generateText } from 'ai';
import { z } from 'zod';

import { DEFAULT_TEXT_MODEL } from '../lib/ai';
import { getLangfusePrompt } from '../lib/langfuse';

// Schemas for pitch processing
const PitchContextSchema = z.object({
  topic: z.string(),
  opportunity: z.string(),
  stakeholders: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      relationship: z.string(),
      mentioned_as: z.string(),
      involvement_level: z.enum(['high', 'medium', 'low']),
    }),
  ),
  context: z.enum(['workplace', 'pitch', 'general']),
  user_role: z.string(),
  key_points: z.array(z.string()),
  meeting_goal: z.string(),
  urgency: z.enum(['high', 'medium', 'low']),
  preparation_notes: z.string(),
});

const MeetingSetupSchema = z.object({
  meetingPurpose: z.string(),
  meetingContext: z.string(),
  duration: z.number(),
  experts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      expertise: z.string(),
      bio: z.string(),
    }),
  ),
});

export interface PitchProcessingResult {
  processedContext: z.infer<typeof PitchContextSchema>;
  meetingData: z.infer<typeof MeetingSetupSchema> & {
    preGeneratedOpenings?: Array<{
      expertId: string;
      message: string;
      timestamp: number;
    }>;
  };
  metadata: {
    processingTime: number;
    aiProvider: string;
    qualityScore: number;
  };
}

export class PitchProcessingService {
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
      // Step 1: Get Langfuse prompts
      const [pitchAnalysisPrompt, meetingSetupPrompt, expertOpeningPrompt] = await Promise.all([
        getLangfusePrompt('pitch-context-analysis').catch(() => null),
        getLangfusePrompt('enhanced-meeting-setup'),
        getLangfusePrompt('expert-opening-message'),
      ]);

      // Step 2: Process pitch context (if we have the prompt)
      let processedContext: z.infer<typeof PitchContextSchema> | null = null;
      if (pitchAnalysisPrompt) {
        processedContext = await this.analyzePitchContext(
          pitchDescription,
          documents,
          pitchAnalysisPrompt,
        );
      }

      // Step 3: Generate meeting setup using existing Langfuse prompt
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

      // Step 4: Generate pre-opening messages
      const preGeneratedOpenings = await this.generateOpeningMessages(
        meetingSetup.object.experts,
        expertOpeningPrompt,
        meetingType,
        pitchDescription,
      );

      const processingTime = Date.now() - startTime;

      return {
        processedContext:
          processedContext || this.createFallbackContext(pitchDescription, meetingSetup.object),
        meetingData: {
          ...meetingSetup.object,
          preGeneratedOpenings,
        },
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
   * Analyze pitch context using Langfuse prompt
   */
  private static async analyzePitchContext(
    pitchDescription: string,
    documents: Array<{ filename: string; content?: string }>,
    pitchAnalysisPrompt: { compile: (data: Record<string, string>) => string },
  ): Promise<z.infer<typeof PitchContextSchema>> {
    const documentContext =
      documents.length > 0
        ? documents
            .map(
              (doc) =>
                `**${doc.filename}**: ${doc.content?.slice(0, 1000) || 'No content available'}`,
            )
            .join('\n\n')
        : 'No documents provided';

    const result = await generateObject({
      model: DEFAULT_TEXT_MODEL,
      schema: PitchContextSchema,
      prompt: pitchAnalysisPrompt.compile({
        pitchDescription,
        documents: documentContext,
      }),
    });

    return result.object;
  }

  /**
   * Generate opening messages using Langfuse prompt
   */
  private static async generateOpeningMessages(
    experts: Array<{ id: string; name: string; role: string; expertise: string }>,
    expertOpeningPrompt: { compile: (data: Record<string, string>) => string },
    meetingType: string,
    pitchDescription: string,
  ): Promise<Array<{ expertId: string; message: string; timestamp: number }>> {
    try {
      const openingMessages = await Promise.all(
        experts.map(async (expert) => {
          const message = await generateText({
            model: DEFAULT_TEXT_MODEL,
            prompt: expertOpeningPrompt.compile({
              expertName: expert.name,
              expertRole: expert.role,
              expertise: expert.expertise,
              meetingType,
              pitchDescription,
            }),
          });

          return {
            expertId: expert.id,
            message: message.text,
            timestamp: Date.now(),
          };
        }),
      );

      return openingMessages;
    } catch (error) {
      console.warn('Failed to generate opening messages:', error);
      return [];
    }
  }

  /**
   * Create fallback context when pitch analysis prompt is not available
   */
  private static createFallbackContext(
    pitchDescription: string,
    meetingSetup: z.infer<typeof MeetingSetupSchema>,
  ): z.infer<typeof PitchContextSchema> {
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
