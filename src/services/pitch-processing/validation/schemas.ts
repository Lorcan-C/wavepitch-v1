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
  context: z.string().default('pitch'), // Allow any string, default to 'pitch'
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
      bio: z.string(),
      avatar: z.string().optional(),
      color: z.string().optional(),
    }),
  ),
});

// Type exports for easy consumption
export type PitchContext = z.infer<typeof PitchContextSchema>;
export type MeetingSetup = z.infer<typeof MeetingSetupSchema>;
