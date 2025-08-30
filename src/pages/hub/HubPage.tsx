import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { format } from 'date-fns';

import { AppContainer } from '../../components/AppContainer';
import { Button } from '../../components/ui/button';
import { ConversationsService, StoredConversation } from '../../services/conversationsService';

const HubPage: React.FC = () => {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
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
    await useMeetingStore.getState().resumeMeeting(conversation.id);
    navigate(`/app/meeting/${conversation.id}`);
  };

  const showSummary = (conversation: StoredConversation) => {
    const transcript =
      conversation.transcript_data.messages
        ?.map((msg: unknown) => {
          const message = msg as { senderName?: string; sender?: string; content?: string };
          return `${message.senderName || message.sender}: ${message.content}`;
        })
        .join('\n\n') || 'No transcript available';

    alert(`Meeting: ${conversation.title}\n\nTranscript:\n${transcript}`);
  };

  if (selectedConversation) {
    return (
      <div className="min-h-screen flex flex-col bg-background overflow-auto relative">
        {/* Preload background image */}
        <link rel="preload" as="image" href="/images/forest_v3.webp" />
        {/* Background image layer with opacity */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/forest_v3.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5,
          }}
        />

        {/* Content layer with full opacity */}
        <div className="relative z-10 container mx-auto p-6">
          <Button onClick={() => setSelectedConversation(null)} className="mb-4">
            ← Back to Hub
          </Button>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">{selectedConversation.title}</h2>
            <p className="text-gray-600 mb-4">
              {format(new Date(selectedConversation.start_time), 'MMM d, yyyy h:mm a')}
            </p>

            <div className="flex gap-4 mb-6">
              <span>{selectedConversation.duration_minutes || 0} minutes</span>
              <span>{selectedConversation.participant_count} participants</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => showSummary(selectedConversation)}>View Summary</Button>
              <Button onClick={() => handleResumeConversation(selectedConversation)}>
                Resume Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-auto relative">
      {/* Preload background image */}
      <link rel="preload" as="image" href="/images/forest_v3.webp" />
      {/* Background image layer with opacity */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/forest_v3.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5,
        }}
      />

      {/* Content layer with full opacity */}
      <div className="relative z-10 container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Conversations</h1>

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
            <AppContainer>
              <div className="p-8">{/* Blank container */}</div>
            </AppContainer>

            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedConversation(conversation)}
              >
                <h3 className="font-medium">{conversation.title}</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(conversation.start_time), 'MMM d, yyyy h:mm a')} •
                  {conversation.duration_minutes || 0} min •{conversation.participant_count}{' '}
                  participants
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HubPage;
