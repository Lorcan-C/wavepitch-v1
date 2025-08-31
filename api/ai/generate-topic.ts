import { generateText } from 'ai';

import { DEFAULT_TEXT_MODEL } from '../../src/lib/ai';
import { ServerPromptService } from '../services/ServerPromptService';

export default async function handler(req: Request) {
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
    // Environment validation
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key missing' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
      return new Response(JSON.stringify({ error: 'Langfuse configuration missing' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { promptName, variables } = await req.json();

    if (!promptName || !variables) {
      return new Response(JSON.stringify({ error: 'promptName and variables are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the prompt from Langfuse
    const prompt = await ServerPromptService.getLangfusePromptCached(promptName);

    if (!prompt) {
      return new Response(JSON.stringify({ error: `Prompt "${promptName}" not found` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate the topic using the prompt
    const { text } = await generateText({
      model: DEFAULT_TEXT_MODEL,
      prompt: prompt.compile(variables),
    });

    return new Response(JSON.stringify({ success: true, topic: text.trim() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Topic generation failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

export const config = {
  runtime: 'edge',
};
