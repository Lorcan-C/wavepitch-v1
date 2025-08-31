import { generateText } from "ai"
import { DEFAULT_TEXT_MODEL } from "../../src/lib/ai"
import { getLangfusePrompt } from "../lib/langfuse"

export default async function handler(req: Request) {
  const { userMessage, agentName, agentRole, agentBio, meetingPurpose } = await req.json()
  
  const contextPrompt = await getLangfusePrompt('in-meeting-response')
  
  const compiledPrompt = contextPrompt.compile({ 
    currentMessage: userMessage,
    agentName: agentName,
    agentRole: agentRole,
    agentDescription: agentBio,
    meetingPurpose: meetingPurpose
  })
  
  const result = await generateText({
    model: DEFAULT_TEXT_MODEL,
    prompt: compiledPrompt
  })

  return new Response(JSON.stringify({ text: result.text }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const config = { runtime: 'edge' }