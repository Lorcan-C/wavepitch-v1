import { generateObject, generateText } from 'ai';
import { z } from 'zod';

import { DEFAULT_TEXT_MODEL } from './ai';
import { getLangfusePrompt } from './langfuse';

export const MeetingDataSchema = z.object({
  meetingPurpose: z.string(),
  experts: z.array(
    z.object({
      name: z.string(),
      bio: z.string(),
      meetingRole: z.string(),
    }),
  ),
  meetingContext: z.string(),
});

export type MeetingData = z.infer<typeof MeetingDataSchema>;

export async function generateMeetingFlow(pitchDescription: string): Promise<MeetingData> {
  // Step 1: Extract Meeting Purpose
  const purposePrompt = await getLangfusePrompt('extract-meeting-purpose');
  const meetingPurpose = await generateText({
    model: DEFAULT_TEXT_MODEL,
    prompt: purposePrompt.compile({ pitchDescription }),
  });

  // Step 2: Generate Expert Team + Meeting Context
  const meetingPrompt = await getLangfusePrompt('generate-meeting-details');
  const meetingDetails = await generateObject({
    model: DEFAULT_TEXT_MODEL,
    schema: z.object({
      experts: z.array(
        z.object({
          name: z.string(),
          bio: z.string(),
          meetingRole: z.string(),
        }),
      ),
      meetingContext: z.string(),
    }),
    prompt: meetingPrompt.compile({
      meetingPurpose: meetingPurpose.text,
      pitchDescription,
    }),
  });

  return {
    meetingPurpose: meetingPurpose.text,
    experts: meetingDetails.object.experts,
    meetingContext: meetingDetails.object.meetingContext,
  };
}
