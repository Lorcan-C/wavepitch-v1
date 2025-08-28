import { generateObject, generateText } from 'ai';
import { z } from 'zod';

import { DEFAULT_TEXT_MODEL } from '../../src/lib/ai';
import { getLangfusePrompt } from '../../src/lib/langfuse';

// Enhanced schemas for MVP demo
const MeetingSetupSchema = z.object({
  meetingPurpose: z.string(),
  meetingContext: z.string(),
  duration: z.number(), // minutes
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
    const { pitchDescription, meetingType = 'pitch' } = await req.json();

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

    // Get enhanced meeting setup prompt from Langfuse
    let meetingSetupPrompt;
    let expertOpeningPrompt;

    try {
      meetingSetupPrompt = await getLangfusePrompt('enhanced-meeting-setup');
      expertOpeningPrompt = await getLangfusePrompt('expert-opening-message');
    } catch (promptError) {
      console.error('Langfuse prompt not found:', promptError);
      throw new Error('Required prompts not configured. Please check Langfuse setup.');
    }

    // Generate complete meeting setup
    const meetingSetup = await generateObject({
      model: DEFAULT_TEXT_MODEL,
      schema: MeetingSetupSchema,
      prompt: meetingSetupPrompt.compile({
        pitchDescription,
        meetingType,
      }),
    });

    // Pre-generate opening messages for smooth demo start
    const openingMessages = await Promise.all(
      meetingSetup.object.experts.map((expert) =>
        generateText({
          model: DEFAULT_TEXT_MODEL,
          prompt: expertOpeningPrompt.compile({
            expertName: expert.name,
            expertRole: expert.role,
            expertise: expert.expertise,
            meetingType,
            pitchDescription,
          }),
        }),
      ),
    );

    const sessionId = crypto.randomUUID();

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        meetingData: {
          ...meetingSetup.object,
          preGeneratedOpenings: openingMessages.map((msg, i) => ({
            expertId: meetingSetup.object.experts[i].id,
            message: msg.text,
            timestamp: Date.now(),
          })),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    console.error('Pre-meeting generation failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Meeting setup failed. Please try again.';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
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
