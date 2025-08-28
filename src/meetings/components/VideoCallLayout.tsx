import React from 'react';

import { Participant, User } from '../types';
import { ParticipantCard } from './ParticipantCard';

interface VideoCallLayoutProps {
  participants: Participant[];
  user: User;
  currentSpeakerId?: string;
  nextSpeakerId?: string;
  onParticipantClick?: (participantId: string) => void;
  onParticipantDoubleClick?: (participantId: string) => void;
  onUserClick?: () => void;
}

export const VideoCallLayout: React.FC<VideoCallLayoutProps> = ({
  participants,
  user,
  currentSpeakerId,
  nextSpeakerId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onParticipantClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onParticipantDoubleClick,
  onUserClick,
}) => {
  // Create user as a participant for rendering with proper state
  const userAsParticipant: Participant = {
    id: user.id,
    name: user.name,
    role: 'You',
    avatar: user.avatar,
    color: user.color,
    isUser: true,
    isSpeaking: currentSpeakerId === user.id,
    isNextToSpeak: nextSpeakerId === user.id,
    isListening: false, // This would be controlled by voice recognition state
  };

  // Map participants with proper state
  const mappedParticipants = participants.map((p) => ({
    ...p,
    isUser: false,
    isSpeaking: currentSpeakerId === p.id,
    isNextToSpeak: nextSpeakerId === p.id,
    isListening: false,
  }));

  // Filter out any meeting chair participants (if needed)
  const visibleParticipants = mappedParticipants.filter((p) => p.role !== 'meeting-chair');

  // Get agents (non-user participants)
  const agents = visibleParticipants.filter((p) => !p.isUser);

  // Create a 2x2 grid layout
  // Position 0: Top-left (first agent)
  // Position 1: Top-right (user)
  // Position 2: Bottom-left (second agent)
  // Position 3: Bottom-right (third agent)

  const gridPositions = [
    agents[0] || null, // Top-left
    userAsParticipant, // Top-right (user)
    agents[1] || null, // Bottom-left
    agents[2] || null, // Bottom-right
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full p-4">
        {gridPositions.map((participant, index) => (
          <div key={participant?.id || `empty-${index}`} className="h-full">
            {participant ? (
              <ParticipantCard
                participant={participant}
                speakingState={
                  participant.isSpeaking
                    ? 'current'
                    : participant.isNextToSpeak
                      ? 'next'
                      : participant.isUser
                        ? 'user'
                        : 'waiting'
                }
                onClick={participant.isUser ? onUserClick : undefined}
              />
            ) : (
              <div className="h-full bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Empty Slot</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
