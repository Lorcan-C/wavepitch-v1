import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Logo } from '../../components/Logo';
import { ConversationCard } from '../../components/inbox/ConversationCard';
import { Button } from '../../components/ui/button';
import { Message, Participant } from '../../meetings/types';
import { ConversationsService, StoredConversation } from '../../services/conversationsService';

const InboxPage: React.FC = () => {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await ConversationsService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeConversation = async (conversation: StoredConversation) => {
    const { useMeetingStore } = await import('../../stores/meeting-store');
    useMeetingStore.getState().loadFromConversationData({
      id: conversation.id,
      title: conversation.title,
      meeting_id: conversation.meeting_id,
      transcript_data: {
        participants: conversation.transcript_data.participants as Participant[],
        messages: conversation.transcript_data.messages as Message[],
      },
    });
    navigate(`/app/meeting/${conversation.id}`);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col relative"
      style={{
        backgroundImage: 'url(/images/pitchflow_v2.webp)',
      }}
    >
      {/* Logo */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-20">
        <Logo size="md" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 mt-20">
          <h1 className="text-2xl font-bold mb-6">Inbox</h1>

          {isLoading ? (
            <div>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-gray-600 mb-4">Start your first meeting to see it here</p>
              <Button onClick={() => navigate('/app/new')}>Start New Meeting</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  title={conversation.title}
                  startTime={conversation.start_time}
                  durationMinutes={conversation.duration_minutes || 0}
                  participantCount={conversation.participant_count}
                  onResume={() => handleResumeConversation(conversation)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
