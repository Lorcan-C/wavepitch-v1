import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { getInitials } from '../../lib/getInitials';
import { MeetingInterface } from '../components/MeetingInterface';
import { Message, Participant, User } from '../types';

// Mock data
const mockParticipants: Participant[] = [
  { id: '1', name: 'Sarah Chen', role: 'Product Manager', avatar: '👩', color: 'purple' },
  { id: '2', name: 'Marcus Johnson', role: 'Engineering Lead', avatar: '👨', color: 'blue' },
  { id: '3', name: 'Rita Patel', role: 'Designer', avatar: '👩', color: 'pink' },
  { id: '4', name: 'James Wilson', role: 'Data Scientist', avatar: '👨', color: 'green' },
];

const mockUser: User = {
  id: 'user-1',
  name: 'You',
  avatar: '🙂',
  color: 'blue',
};

const mockMessages: Message[] = [
  {
    id: '1',
    content:
      "Welcome everyone to our product planning meeting. Today we'll be discussing our Q2 roadmap and prioritizing the key features for our next release.",
    sender: '1',
    isUser: false,
    timestamp: Date.now() - 300000,
    senderName: 'Sarah Chen',
  },
  {
    id: '2',
    content:
      "Thanks Sarah! I've prepared some technical feasibility notes for the features we discussed last week.",
    sender: '2',
    isUser: false,
    timestamp: Date.now() - 240000,
    senderName: 'Marcus Johnson',
  },
  {
    id: '3',
    content:
      'Great! I have some user research insights that might help us prioritize. Should I share those first?',
    sender: 'user-1',
    isUser: true,
    timestamp: Date.now() - 180000,
    senderName: 'You',
  },
  {
    id: '4',
    content:
      'Yes, that would be perfect. User insights should definitely guide our technical decisions.',
    sender: '1',
    isUser: false,
    timestamp: Date.now() - 120000,
    senderName: 'Sarah Chen',
  },
  {
    id: '5',
    content:
      "I've also been analyzing the performance metrics from our current features. There are some interesting patterns in user engagement.",
    sender: '4',
    isUser: false,
    timestamp: Date.now() - 60000,
    senderName: 'James Wilson',
  },
];

export const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [meetingTitle, setMeetingTitle] = useState('Product Planning Meeting');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load meeting data from stored session
  useEffect(() => {
    const loadMeetingData = () => {
      try {
        setIsLoading(true);

        // Load from stored session data
        const storedSession = sessionStorage.getItem('meetingSession');
        if (!storedSession) {
          throw new Error('No meeting session found. Please start a new meeting.');
        }

        const sessionData = JSON.parse(storedSession);

        // Check if this is the correct session
        if (sessionData.sessionId !== meetingId) {
          throw new Error('Meeting session mismatch. Please start a new meeting.');
        }

        if (!sessionData.meetingData) {
          throw new Error('Invalid meeting data. Please start a new meeting.');
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

        setParticipants(apiParticipants);
        setMessages(initialMessages);
        setMeetingTitle(data.meetingPurpose || 'AI Business Meeting');
      } catch (error) {
        console.error('Error loading meeting data:', error);
        setError('Failed to load meeting. Using default data.');
        // Keep mock data as fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetingData();
  }, [meetingId]);

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

  // Show error state
  if (error) {
    console.warn('Meeting loading error:', error);
    // Continue with fallback data
  }

  // Mock current speaker logic - will be managed by the interface
  const currentSpeakerId = participants[0]?.id;
  const nextSpeakerId = mockUser.id;

  return (
    <MeetingInterface
      meetingId={meetingId || 'default-meeting'}
      meetingTitle={meetingTitle}
      participants={participants}
      user={mockUser}
      messages={messages}
      currentSpeakerId={currentSpeakerId}
      nextSpeakerId={nextSpeakerId}
    />
  );
};
