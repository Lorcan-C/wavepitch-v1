import { Langfuse } from 'langfuse';

// Initialize Langfuse client with Vercel environment variables
export const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
});

// Helper function to get a prompt from Langfuse
export async function getLangfusePrompt(name: string, version?: number) {
  try {
    const prompt = await langfuse.getPrompt(name, version);
    return prompt;
  } catch (error) {
    console.error(`Failed to get prompt "${name}" from Langfuse:`, error);
    throw error;
  }
}
