import { z } from 'zod';

// Schemas for pitch processing
export const PitchContextSchema = z.object({
  topic: z.string(),
  opportunity: z.string(),
  stakeholders: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      relationship: z.string(),
      mentioned_as: z.string(),
      involvement_level: z.string(), // Simplified from enum to string
    }),
  ),
  context: z.enum(['workplace', 'pitch', 'general']), // Keeping this one as it's core to meeting types
  user_role: z.string(),
  key_points: z.array(z.string()),
  meeting_goal: z.string(),
  urgency: z.string(), // Simplified from enum to string
  preparation_notes: z.string(),
});

export const MeetingSetupSchema = z.object({
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

// Type exports for easy consumption
export type PitchContext = z.infer<typeof PitchContextSchema>;
export type MeetingSetup = z.infer<typeof MeetingSetupSchema>;
