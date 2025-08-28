import React from 'react';

import { Participant, SpeakingState } from '../types';

interface ParticipantCardProps {
  participant: Participant;
  speakingState: SpeakingState;
  onClick?: () => void;
}

const getSpeakingStyles = (state: SpeakingState) => {
  switch (state) {
    case 'current':
      return 'ring-4 ring-green-500';
    case 'next':
      return 'ring-4 ring-yellow-500';
    case 'user':
      return 'ring-2 ring-blue-500';
    default:
      return 'ring-1 ring-gray-300';
  }
};

const getBackgroundColor = (color: Participant['color']) => {
  const colorMap = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    pink: 'bg-pink-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return colorMap[color];
};

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  speakingState,
  onClick,
}) => {
  return (
    <div
      className={`
        relative bg-gray-800 rounded-lg p-4 lg:p-6 shadow-lg cursor-pointer
        transition-all duration-200 hover:bg-gray-700 hover:shadow-xl
        min-h-[200px] w-full aspect-square flex flex-col justify-center
        ${getSpeakingStyles(speakingState)}
      `}
      onClick={() => {
        console.log('Participant clicked:', participant.name);
        onClick?.();
      }}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-3 lg:mb-4">
        <div
          className={`
          w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center 
          text-xl lg:text-2xl
          ${getBackgroundColor(participant.color)}
        `}
        >
          {participant.avatar}
        </div>
      </div>

      {/* Name and Role */}
      <div className="text-center">
        <h3 className="text-white font-semibold text-base lg:text-lg mb-1 truncate">
          {participant.name}
        </h3>
        <p className="text-gray-300 text-xs lg:text-sm truncate">{participant.role}</p>
      </div>

      {/* Speaking Indicator */}
      {speakingState === 'current' && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {speakingState === 'next' && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};
