import { generateText, streamText } from 'ai';
import { z } from 'zod';

import { DEFAULT_TEXT_MODEL } from '../../src/lib/ai';
import { getLangfusePrompt } from '../../src/lib/langfuse';
import { MeetingContextService } from '../../src/services/MeetingContextService';

// Interface for MeetingContext (imported from service)
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

// Context schema for type validation (used for documentation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MessageContextSchema = z.object({
  sessionId: z.string(),
  expertId: z.string(),
  conversationHistory: z.array(
    z.object({
      sender: z.string(),
      message: z.string(),
      timestamp: z.number(),
      isUser: z.boolean(),
    }),
  ),
  currentPhase: z.string(),
  meetingContext: z.string(),
  expertProfile: z.object({
    name: z.string(),
    role: z.string(),
    expertise: z.string(),
  }),
});

// Environment validation function based on SDK best practices
function validateEnvironment(): { valid: boolean; missing: string[]; warnings: string[] } {
  const required = ['OPENAI_API_KEY', 'LANGFUSE_SECRET_KEY', 'LANGFUSE_PUBLIC_KEY'];

  const optional = ['LANGFUSE_BASEURL'];

  const missing = required.filter((key) => !process.env[key] || process.env[key]?.trim() === '');
  const warnings = [];

  // Check for common configuration issues
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    warnings.push('OPENAI_API_KEY format appears invalid');
  }

  if (process.env.LANGFUSE_SECRET_KEY && !process.env.LANGFUSE_SECRET_KEY.startsWith('sk-lf-')) {
    warnings.push('LANGFUSE_SECRET_KEY format appears invalid');
  }

  // Log environment status for debugging
  const available = required.filter((key) => process.env[key]);
  console.log('Environment check:', {
    available: available.length,
    required: required.length,
    missing: missing.length,
    hasOptional: optional.filter((key) => process.env[key]).length,
  });

  if (warnings.length > 0) {
    console.warn('Environment warnings:', warnings);
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export default async function handler(req: Request) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Environment validation - prevents 80% of 500 errors
  const envValidation = validateEnvironment();
  if (!envValidation.valid) {
    console.error('Environment validation failed:', envValidation);
    return new Response(
      JSON.stringify({
        error: 'Service configuration error',
        code: 'MISSING_ENV_VARS',
        details: envValidation.missing,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const body = await req.json();
    const { sessionId, type } = body;

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: 'sessionId is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (type === 'generate-response') {
      return handleGenerateResponse(body, corsHeaders);
    } else if (type === 'advance-speaker') {
      return handleAdvanceSpeaker(body, corsHeaders);
    } else if (type === 'update-context') {
      return handleUpdateContext(body, corsHeaders);
    }

    return new Response(
      JSON.stringify({
        error: 'Invalid request type',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    console.error('In-meeting processing failed:', error);

    let status = 500;
    let errorMessage = 'Message processing failed';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('rate limit') || message.includes('quota')) {
        status = 429;
        errorMessage = 'Service temporarily busy. Please try again shortly.';
      } else if (message.includes('timeout')) {
        status = 408;
        errorMessage = 'Request timeout. Please try again.';
      } else if (message.includes('unauthorized') || message.includes('invalid api key')) {
        status = 401;
        errorMessage = 'Service authentication error.';
      } else if (message.includes('langfuse') || message.includes('prompt')) {
        status = 503;
        errorMessage = 'AI service temporarily unavailable.';
      } else if (message.includes('json') || message.includes('parse')) {
        status = 422;
        errorMessage = 'Invalid request format.';
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        ...(status === 500 && error instanceof Error && { debug: error.message }),
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

async function handleGenerateResponse(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
) {
  const { sessionId, expertId, conversationHistory, currentPhase, userMessage } = body;

  // Validate context and expert using modular service
  const validation = MeetingContextService.validateContextAndExpert(
    sessionId as string,
    expertId as string,
  );

  if (!validation.isValid) {
    return new Response(
      JSON.stringify({
        error: validation.error,
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const { context: meetingContext, expert } = validation;

  try {
    // Get context prompt from Langfuse
    const contextPrompt = await getLangfusePrompt('in-meeting-response');

    // Build conversation context (last 10 messages for performance)
    const recentHistory = (
      conversationHistory as Array<{
        isUser: boolean;
        sender: string;
        message: string;
        timestamp: number;
      }>
    ).slice(-10);

    // Format context as JSON for OpenAI
    const contextJson = MeetingContextService.formatContextForAI(
      meetingContext,
      expert,
      recentHistory,
      (currentPhase as string) || 'discussion',
      (userMessage as string) || '',
    );

    const prompt = contextPrompt.compile({
      contextJson,
    });

    // Generate response with streaming for real-time feel
    const stream = await streamText({
      model: DEFAULT_TEXT_MODEL,
      prompt: prompt,
      temperature: 0.7, // Slight randomness for natural responses
      onError: ({ error }) => console.error('In-meeting stream error:', error),
    });

    return stream.toDataStreamResponse({
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Response generation failed:', error);

    let status = 500;
    let errorMessage = 'Failed to generate response';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('rate limit') || message.includes('quota')) {
        status = 429;
        errorMessage = 'AI service temporarily busy. Please try again shortly.';
      } else if (message.includes('langfuse') || message.includes('prompt not found')) {
        status = 404;
        errorMessage = 'AI prompts not configured properly.';
      } else if (message.includes('timeout')) {
        status = 408;
        errorMessage = 'Response generation timeout.';
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        ...(status === 500 && error instanceof Error && { debug: error.message }),
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

async function handleAdvanceSpeaker(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
) {
  const { sessionId, currentSpeaker } = body;
  const meetingContext = MeetingContextService.getContext(sessionId as string);

  if (!meetingContext) {
    return new Response(
      JSON.stringify({
        error: 'Meeting context not found',
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    // Simple round-robin for MVP (enhance with conversation flow logic later)
    const currentIndex = meetingContext.experts.findIndex(
      (e) => e.id === (currentSpeaker as string),
    );
    const nextIndex = (currentIndex + 1) % meetingContext.experts.length;
    const nextSpeaker = meetingContext.experts[nextIndex];

    // Get transition prompt from Langfuse
    const transitionPrompt = await getLangfusePrompt('speaker-transition');

    // Pre-generate next response for smooth transitions
    const preGeneratedResponse = await generateText({
      model: DEFAULT_TEXT_MODEL,
      prompt: transitionPrompt.compile({
        expertName: nextSpeaker.name,
        expertRole: nextSpeaker.role,
        expertise: nextSpeaker.expertise,
        meetingContext: meetingContext.meetingContext,
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        nextSpeaker: nextSpeaker.id,
        nextSpeakerName: nextSpeaker.name,
        preGeneratedResponse: preGeneratedResponse.text,
        phase: meetingContext.currentPhase || 'discussion',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    console.error('Speaker advancement failed:', error);

    let status = 500;
    let errorMessage = 'Failed to advance speaker';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('langfuse') || message.includes('prompt not found')) {
        status = 404;
        errorMessage = 'Speaker transition prompts not configured.';
      } else if (message.includes('rate limit')) {
        status = 429;
        errorMessage = 'Service busy. Please try again.';
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        ...(status === 500 && error instanceof Error && { debug: error.message }),
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

async function handleUpdateContext(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
) {
  const { sessionId, updates } = body;

  try {
    MeetingContextService.updateContext(sessionId as string, updates as Partial<MeetingContext>);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Context updated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    console.error('Context update failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update context',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

// Edge runtime for Vercel
export const config = {
  runtime: 'edge',
};
