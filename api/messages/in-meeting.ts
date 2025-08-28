import { generateText, streamText } from 'ai';
import { z } from 'zod';

import { DEFAULT_TEXT_MODEL } from '../../src/lib/ai';
import { getLangfusePrompt } from '../../src/lib/langfuse';

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

// In-memory context store for MVP (replace with Redis for production)
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

const meetingContexts = new Map<string, MeetingContext>();

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

  // Get meeting context
  const meetingContext = meetingContexts.get(sessionId);
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

  const expert = meetingContext.experts.find((e) => e.id === expertId);
  if (!expert) {
    return new Response(
      JSON.stringify({
        error: 'Expert not found',
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    // Get context prompt from Langfuse
    const contextPrompt = await getLangfusePrompt('in-meeting-response');

    // Build conversation context (last 10 messages for performance)
    const recentHistory = conversationHistory.slice(-10);
    const historyText = recentHistory
      .map((msg: Record<string, unknown>) => `${msg.isUser ? 'User' : msg.sender}: ${msg.message}`)
      .join('\n');

    const prompt = contextPrompt.compile({
      expertName: expert.name,
      expertRole: expert.role,
      expertise: expert.expertise,
      meetingContext: meetingContext.meetingContext,
      currentPhase: currentPhase || 'discussion',
      conversationHistory: historyText,
      userMessage: userMessage || '',
    });

    // Generate response with streaming for real-time feel
    const stream = await streamText({
      model: DEFAULT_TEXT_MODEL,
      prompt: prompt,
      temperature: 0.7, // Slight randomness for natural responses
    });

    return new Response(stream.toAIStream(), {
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
  const meetingContext = meetingContexts.get(sessionId);

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
    const currentIndex = meetingContext.experts.findIndex((e) => e.id === currentSpeaker);
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
    if (meetingContexts.has(sessionId)) {
      const context = meetingContexts.get(sessionId);
      meetingContexts.set(sessionId, { ...context, ...updates });
    } else {
      meetingContexts.set(sessionId, updates);
    }

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
