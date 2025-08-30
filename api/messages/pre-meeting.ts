import { PitchProcessingService } from '../services/PitchProcessingService';

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
    const { pitchDescription, meetingType = 'pitch', documents = [] } = await req.json();

    if (!pitchDescription || typeof pitchDescription !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'pitchDescription is required and must be a string',
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

    // Use the modular PitchProcessingService
    const result = await PitchProcessingService.processPitchFlow(
      pitchDescription,
      meetingType,
      documents,
    );

    const sessionId = crypto.randomUUID();

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        meetingData: result.meetingData,
        processedContext: result.processedContext,
        metadata: result.metadata,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    console.error('Pre-meeting generation failed:', error);

    let status = 500;
    let errorMessage = 'Meeting setup failed. Please try again.';

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // OpenAI/AI SDK specific errors
      if (message.includes('rate limit') || message.includes('quota')) {
        status = 429;
        errorMessage = 'Service is temporarily busy. Please try again in a few moments.';
      } else if (message.includes('context length') || message.includes('too long')) {
        status = 413;
        errorMessage = 'Your description is too long. Please shorten it and try again.';
      } else if (message.includes('model not found') || message.includes('model_not_found')) {
        status = 404;
        errorMessage = 'AI model temporarily unavailable. Please try again later.';
      } else if (message.includes('invalid api key') || message.includes('unauthorized')) {
        status = 401;
        errorMessage = 'Service authentication error. Please contact support.';
      } else if (message.includes('permission denied') || message.includes('forbidden')) {
        status = 403;
        errorMessage = 'Service access denied. Please contact support.';
      } else if (message.includes('content filter') || message.includes('safety')) {
        status = 422;
        errorMessage = 'Content not suitable for processing. Please modify your description.';
      }

      // Langfuse specific errors
      else if (message.includes('prompt not found') || message.includes('langfuse prompt')) {
        status = 404;
        errorMessage = 'Required AI prompts not configured. Please contact support.';
      } else if (message.includes('langfuse') || message.includes('prompt')) {
        status = 503;
        errorMessage = 'AI prompt service temporarily unavailable. Please try again.';
      }

      // Network/timeout errors
      else if (message.includes('timeout') || message.includes('aborted')) {
        status = 408;
        errorMessage = 'Request timeout. Please try again.';
      } else if (message.includes('network') || message.includes('fetch')) {
        status = 503;
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      // JSON parsing errors
      else if (message.includes('json') || message.includes('parse')) {
        status = 422;
        errorMessage = 'Invalid data format. Please try again.';
      }

      // If it's a more specific error message, use it
      if (status !== 500) {
        // Keep the custom error message
      } else {
        // For generic 500 errors, provide the actual error message for debugging
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        ...(status === 500 && { debug: error instanceof Error ? error.stack : undefined }),
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
