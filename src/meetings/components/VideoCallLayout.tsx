import React from 'react';

import { Participant, SpeakingState, User } from '../types';
import { ParticipantCard } from './ParticipantCard';

interface VideoCallLayoutProps {
  participants: Participant[];
  user: User;
  currentSpeakerId?: string;
  nextSpeakerId?: string;
}

const getGridCols = (count: number) => {
  if (count <= 4) return 'grid-cols-2';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
};

const getSpeakingState = (
  participantId: string,
  userId: string,
  currentSpeakerId?: string,
  nextSpeakerId?: string,
): SpeakingState => {
  if (participantId === userId) return 'user';
  if (participantId === currentSpeakerId) return 'current';
  if (participantId === nextSpeakerId) return 'next';
  return 'waiting';
};

export const VideoCallLayout: React.FC<VideoCallLayoutProps> = ({
  participants,
  user,
  currentSpeakerId,
  nextSpeakerId,
}) => {
  const totalParticipants = participants.length + 1; // +1 for user
  const gridCols = getGridCols(totalParticipants);

  // Create user as a participant for rendering
  const userAsParticipant: Participant = {
    id: user.id,
    name: user.name,
    role: 'You',
    avatar: user.avatar,
    color: user.color,
  };

  const allParticipants = [userAsParticipant, ...participants];

  return (
    <div className="bg-gray-900 p-6 h-full">
      <div
        className={`
        grid ${gridCols} gap-4 h-full
        ${totalParticipants <= 4 ? 'max-w-4xl' : 'max-w-6xl'} 
        mx-auto content-center
      `}
      >
        {allParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            speakingState={getSpeakingState(
              participant.id,
              user.id,
              currentSpeakerId,
              nextSpeakerId,
            )}
            onClick={() => console.log('Participant selected:', participant.name)}
          />
        ))}
      </div>
    </div>
  );
};
