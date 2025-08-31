import { InMeetingProcessingService } from '../services/InMeetingProcessingService';

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

    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Service configuration error - OpenAI API key missing',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable - Langfuse configuration missing',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    let result;

    // if (type === 'generate-response') {
    //   result = await InMeetingProcessingService.generateResponse(
    //     sessionId,
    //     body.expertId as string,
    //     body.conversationHistory as Array<{
    //       isUser: boolean;
    //       sender: string;
    //       message: string;
    //       timestamp: number;
    //     }>,
    //     body.currentPhase as string,
    //     body.userMessage as string,
    //   );

    //   if (result.success && result.data) {
    //     return result.data.toDataStreamResponse({
    //       headers: {
    //         ...corsHeaders,
    //         'Content-Type': 'text/plain; charset=utf-8',
    //         'Cache-Control': 'no-cache',
    //       },
    //     });
    //   }
    // }

    if (type === 'advance-speaker') {
      result = await InMeetingProcessingService.advanceSpeaker(
        sessionId,
        body.currentSpeaker as string,
      );
    } else if (type === 'update-context') {
      result = await InMeetingProcessingService.updateContext(
        sessionId,
        body.updates as Partial<{
          experts: Array<{
            id: string;
            name: string;
            role: string;
            expertise: string;
          }>;
          meetingContext: string;
          currentPhase?: string;
        }>,
      );
    } else {
      return new Response(
        JSON.stringify({
          error: 'Invalid request type',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify(result.data || result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('In-meeting processing failed:', error);

    let status = 500;
    let errorMessage = 'Message processing failed';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('rate limit') || message.includes('quota')) {
        status = 429;
        errorMessage = 'Service is temporarily busy. Please try again in a few moments.';
      } else if (message.includes('context length') || message.includes('too long')) {
        status = 413;
        errorMessage = 'Message is too long. Please shorten it and try again.';
      } else if (message.includes('model not found') || message.includes('model_not_found')) {
        status = 503;
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
      } else if (message.includes('timeout')) {
        status = 408;
        errorMessage = 'Request timeout. Please try again.';
      } else if (message.includes('unauthorized') || message.includes('invalid api key')) {
        status = 401;
        errorMessage = 'Service authentication error.';
      } else if (message.includes('json') || message.includes('parse')) {
        status = 422;
        errorMessage = 'Invalid request format.';
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

// Edge runtime for Vercel
export const config = {
  runtime: 'edge',
};
