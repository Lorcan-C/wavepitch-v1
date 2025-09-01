import { useState } from 'react';

import { useSession, useUser } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import { Cloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useMeetingStore } from '@/stores/meeting-store';

export function SaveTranscriptButton() {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useUser();
  const { session } = useSession();

  // Get meeting data from your store
  const { meetingId, meetingTitle, participants, messages, meetingStartTime } = useMeetingStore();

  // Create Supabase client with Clerk token (following Clerk's official pattern)
  function createClerkSupabaseClient() {
    return createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      },
    );
  }

  async function saveTranscript() {
    if (!user || messages.length === 0) {
      toast.error('No transcript to save');
      return;
    }

    setIsSaving(true);
    const client = createClerkSupabaseClient();

    try {
      // Format the meeting data
      const transcriptData = {
        id: meetingId,
        user_id: user.id,
        title: meetingTitle || 'Untitled Meeting',
        platform: 'wavepitch',
        meeting_id: meetingId,
        start_time: meetingStartTime || new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: Math.round(
          (new Date().getTime() - new Date(meetingStartTime || new Date()).getTime()) / (1000 * 60),
        ),
        participant_count: participants.length,
        transcript_data: {
          participants,
          messages,
          segments: messages.map((msg, index) => ({
            id: msg.id,
            speaker: msg.senderName || msg.sender,
            text: msg.content,
            startTime: index * 30,
            endTime: (index + 1) * 30,
            confidence: 1.0,
          })),
          fullText: messages.map((msg) => msg.content).join(' '),
        },
      };

      // Save to Supabase
      const { error } = await client.from('conversations_v2').upsert(transcriptData, {
        onConflict: 'id',
      });

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Failed to save transcript');
      } else {
        toast.success('Transcript saved successfully!');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  }

  // Don't show button if no messages
  if (messages.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={saveTranscript}
      disabled={isSaving}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Cloud className="h-4 w-4" />
          Save Transcript
        </>
      )}
    </Button>
  );
}
