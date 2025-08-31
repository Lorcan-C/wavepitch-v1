import { createClient } from '@supabase/supabase-js';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const {
      meetingId,
      sessionId,
      title,
      participants,
      messages,
      startTime,
      endTime,
      duration,
      summary,
      userId,
    } = await req.json();

    if (!meetingId || !userId || !title) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const conversationRecord = {
      id: meetingId,
      user_id: userId,
      meeting_id: meetingId,
      title,
      platform: 'wavepitch',
      status: 'completed',
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      participant_count: participants?.length || 0,
      message_count: messages?.length || 0,
      participants: participants || [],
      messages: messages || [],
      metadata: {
        sessionId,
        summary,
        savedAt: new Date().toISOString(),
        version: '2.0',
      },
    };

    const { data, error } = await supabase
      .from('conversations_v2')
      .upsert(conversationRecord, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase save error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Conversation saved: ${meetingId}`);
    return new Response(JSON.stringify({ success: true, conversationId: meetingId, data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Save conversation error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = { runtime: 'edge' };
