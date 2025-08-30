import React, { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { getInitials } from '../../lib/getInitials';
import { useMeetingStore } from '../../stores/meeting-store';
import { MeetingInterface } from '../components/MeetingInterface';
import { Message, Participant, User } from '../types';

export const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadMeeting = useMeetingStore((state) => state.loadMeeting);

  // Load meeting data from stored session
  useEffect(() => {
    const loadMeetingData = async () => {
      try {
        setIsLoading(true);

        // Load from stored session data
        const storedSession = sessionStorage.getItem('meetingSession');
        if (!storedSession) {
          console.error('No meeting session found');
          navigate('/app');
          return;
        }

        const sessionData = JSON.parse(storedSession);

        // Check if this is the correct session
        if (sessionData.sessionId !== meetingId) {
          console.error('Meeting session mismatch');
          navigate('/app');
          return;
        }

        if (!sessionData.meetingData) {
          console.error('Invalid meeting data');
          navigate('/app');
          return;
        }

        console.log('Loading meeting from stored session:', sessionData);
        const data = sessionData.meetingData;

        // Convert API participants to our format
        const apiParticipants: Participant[] = data.experts.map(
          (
            expert: { id: string; name: string; role: string; expertise: string; bio: string },
            index: number,
          ) => ({
            id: expert.id,
            name: expert.name,
            role: expert.role,
            description: expert.bio || '',
            avatar: getInitials(expert.name),
            color: ['purple', 'blue', 'pink', 'green', 'yellow'][index % 5] as Participant['color'],
          }),
        );

        // Convert pre-generated openings to messages
        const initialMessages: Message[] =
          data.preGeneratedOpenings?.map(
            (opening: { message: string; expertId: string; timestamp: number }, index: number) => ({
              id: `opening-${index}`,
              content: opening.message,
              sender: opening.expertId,
              isUser: false,
              timestamp: opening.timestamp,
              senderName:
                apiParticipants.find((p) => p.id === opening.expertId)?.name || 'AI Assistant',
            }),
          ) || [];

        // Create user object
        const userData: User = {
          id: 'user-1',
          name: 'You',
          avatar: getInitials('You'),
          color: 'blue',
        };

        setUser(userData);
        setParticipants(apiParticipants);
        setMessages(initialMessages);
        setMeetingTitle(data.meetingPurpose || 'AI Business Meeting');

        // Also populate the meeting store for ExpertPreviewDialog
        loadMeeting({
          meetingId: meetingId!,
          sessionId: sessionData.sessionId,
          meetingTitle: data.meetingPurpose || 'AI Business Meeting',
          participants: apiParticipants,
          messages: initialMessages,
        });
      } catch (error) {
        console.error('Error loading meeting data:', error);
        navigate('/app');
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetingData();
  }, [meetingId, loadMeeting, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading meeting...</p>
        </div>
      </div>
    );
  }

  // If no user data, redirect (should not happen if loading worked)
  if (!user) {
    navigate('/app');
    return null;
  }

  // Current speaker logic - will be managed by the interface
  const currentSpeakerId = participants[0]?.id;
  const nextSpeakerId = participants[1]?.id;

  return (
    <MeetingInterface
      meetingId={meetingId || 'default-meeting'}
      meetingTitle={meetingTitle}
      participants={participants}
      user={user}
      messages={messages}
      currentSpeakerId={currentSpeakerId}
      nextSpeakerId={nextSpeakerId}
    />
  );
};
