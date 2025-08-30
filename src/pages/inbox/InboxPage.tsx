import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { format } from 'date-fns';

import { Logo } from '../../components/Logo';
import { Button } from '../../components/ui/button';
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
    await useMeetingStore.getState().resumeMeeting(conversation.id);
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
          <h1 className="text-3xl font-bold mb-6">Your Inbox</h1>

          {isLoading ? (
            <div>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div>
              <div className="text-center py-6 mb-6">
                <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-4">Start your first meeting to see it here</p>
                <Button onClick={() => navigate('/app/new')}>Start New Meeting</Button>
              </div>
              
              <div className="space-y-4 opacity-50">
                <h4 className="text-sm text-gray-500 mb-2">Example of what your meetings will look like:</h4>
                {[
                  { title: 'Product Strategy Discussion', duration: 45, participants: 3, time: 'Today at 2:00 PM' },
                  { title: 'Team Standup', duration: 15, participants: 5, time: 'Yesterday at 10:00 AM' },
                  { title: 'Client Presentation', duration: 60, participants: 4, time: 'Monday at 3:30 PM' }
                ].map((placeholder, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 pointer-events-none"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-1">{placeholder.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {placeholder.time} • {placeholder.duration} min • {placeholder.participants} participants
                        </p>
                      </div>
                      <Button disabled className="ml-4 opacity-50">
                        Resume
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1">{conversation.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {format(new Date(conversation.start_time), 'MMM d, yyyy h:mm a')} •
                        {conversation.duration_minutes || 0} min •{conversation.participant_count}{' '}
                        participants
                      </p>
                    </div>
                    <Button onClick={() => handleResumeConversation(conversation)} className="ml-4">
                      Resume
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
