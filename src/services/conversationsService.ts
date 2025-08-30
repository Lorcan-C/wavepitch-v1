import { supabase } from '../lib/supabase';

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
    participants: unknown[];
    messages: unknown[];
  };
  user_id: string;
}

export class ConversationsService {
  static async getConversations(): Promise<StoredConversation[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(
          'id, title, platform, meeting_id, start_time, end_time, duration_minutes, participant_count, transcript_data, user_id',
        )
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  }
}
