import React from 'react';

import { Participant, User } from '../types';
import { ParticipantCard } from './ParticipantCard';

interface DesktopVideoCallLayoutProps {
  participants: Participant[];
  user: User;
  currentSpeakerId?: string;
  nextSpeakerId?: string;
  onParticipantClick?: (participantId: string) => void;
  onParticipantDoubleClick?: (participantId: string) => void;
  onUserClick?: () => void;
}

export const DesktopVideoCallLayout: React.FC<DesktopVideoCallLayoutProps> = ({
  participants,
  user,
  currentSpeakerId,
  nextSpeakerId,
  onParticipantClick,
  onParticipantDoubleClick,
  onUserClick,
}) => {
  const userAsParticipant: Participant = {
    id: user.id,
    name: user.name,
    role: 'You',
    avatar: user.avatar,
    color: user.color,
    description: '',
    isUser: true,
    isSpeaking: currentSpeakerId === user.id,
    isNextToSpeak: nextSpeakerId === user.id,
    isListening: false,
  };

  const mappedParticipants = participants.map((p) => ({
    ...p,
    isUser: false,
    isSpeaking: currentSpeakerId === p.id,
    isNextToSpeak: nextSpeakerId === p.id,
    isListening: false,
  }));

  const visibleParticipants = mappedParticipants.filter((p) => p.role !== 'meeting-chair');
  const agents = visibleParticipants.filter((p) => !p.isUser);

  const gridPositions = [
    agents[0] || null,
    userAsParticipant,
    agents[1] || null,
    agents[2] || null,
  ];

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-6 h-full p-6">
      {gridPositions.map((participant, index) => (
        <div key={participant?.id || `empty-${index}`} className="h-full min-h-[300px]">
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
              onPersonaClick={!participant.isUser ? onParticipantClick : undefined}
              onPersonaDoubleClick={!participant.isUser ? onParticipantDoubleClick : undefined}
            />
          ) : (
            <div className="h-full bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20 flex items-center justify-center">
              <div className="text-muted-foreground text-base">Empty Slot</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
