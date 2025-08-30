import { useCallback } from 'react';

import { useAuth } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';

import { Message, Participant } from '../meetings/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface StoredConversation {
  id: string;
  title: string;
  platform: string;
  meeting_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  participant_count: number;
  transcript_data: {
    participants: Participant[];
    messages: Message[];
    [key: string]: unknown;
  };
  user_id: string;
}

export interface MeetingData {
  meetingId: string;
  meetingTitle: string;
  participants: Participant[];
  messages: Message[];
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  sessionId: string;
}

export function useClerkSupabase() {
  const { getToken, userId, isSignedIn, isLoaded } = useAuth();

  const createAuthenticatedClient = useCallback(() => {
    if (!isSignedIn || !userId) return null;

    return createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => (await getToken()) ?? null,
    });
  }, [getToken, userId, isSignedIn]);

  const saveMeeting = useCallback(
    async (meetingData: MeetingData): Promise<boolean> => {
      if (!isSignedIn || !userId) {
        console.warn('Cannot save meeting: user not authenticated');
        return false;
      }

      if (
        !meetingData.meetingId ||
        !meetingData.meetingTitle ||
        meetingData.messages.length === 0
      ) {
        console.log('No valid meeting data to save');
        return false;
      }

      try {
        const client = createAuthenticatedClient();
        if (!client) return false;

        const startTime = meetingData.meetingStartTime || new Date().toISOString();
        const endTime = meetingData.meetingEndTime || new Date().toISOString();
        const durationMinutes = Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60),
        );

        const transcriptData = {
          id: meetingData.meetingId,
          title: meetingData.meetingTitle,
          platform: 'wavepitch',
          meetingId: meetingData.meetingId,
          startTime,
          endTime,
          durationMinutes,
          participantCount: meetingData.participants.length,
          participants: meetingData.participants,
          messages: meetingData.messages,
          segments: meetingData.messages.map((msg, index) => ({
            id: msg.id,
            speaker: msg.senderName || msg.sender,
            text: msg.content,
            startTime: index * 30,
            endTime: (index + 1) * 30,
            confidence: 1.0,
          })),
          fullText: meetingData.messages.map((msg) => msg.content).join(' '),
          sessionId: meetingData.sessionId,
        };

        const { error } = await client.from('conversations').upsert(
          {
            id: meetingData.meetingId,
            title: meetingData.meetingTitle,
            platform: 'wavepitch',
            meeting_id: meetingData.meetingId,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: durationMinutes,
            participant_count: meetingData.participants.length,
            transcript_data: transcriptData,
            user_id: userId,
          },
          {
            onConflict: 'id',
          },
        );

        if (error) {
          console.error('Failed to save meeting to Supabase:', error);
          return false;
        }

        console.log('Meeting saved to Supabase successfully');
        return true;
      } catch (error) {
        console.error('Error saving meeting:', error);
        return false;
      }
    },
    [createAuthenticatedClient, isSignedIn, userId],
  );

  const loadConversations = useCallback(async (): Promise<StoredConversation[]> => {
    if (!isSignedIn || !userId) {
      console.warn('Cannot load conversations: user not authenticated');
      return [];
    }

    try {
      const client = createAuthenticatedClient();
      if (!client) return [];

      const { data, error } = await client
        .from('conversations')
        .select(
          'id, title, platform, meeting_id, start_time, end_time, duration_minutes, participant_count, transcript_data, user_id',
        )
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }, [createAuthenticatedClient, isSignedIn, userId]);

  const resumeConversation = useCallback(
    async (conversationId: string): Promise<StoredConversation | null> => {
      if (!isSignedIn || !userId) {
        console.warn('Cannot resume conversation: user not authenticated');
        return null;
      }

      try {
        const client = createAuthenticatedClient();
        if (!client) return null;

        const { data, error } = await client
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Failed to resume conversation:', error);
        return null;
      }
    },
    [createAuthenticatedClient, isSignedIn, userId],
  );

  return {
    isAuthenticated: isSignedIn && isLoaded,
    userId,
    saveMeeting,
    loadConversations,
    resumeConversation,
  };
}
