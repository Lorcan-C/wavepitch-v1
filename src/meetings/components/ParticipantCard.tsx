import React from 'react';

import { Participant, SpeakingState } from '../types';
import { useParticipantClickHandlers } from './ParticipantClickHandlers';
import { ParticipantStatusBadge } from './ParticipantStatusBadge';
import { ParticipantStatusIndicator } from './ParticipantStatusIndicator';
import { ParticipantVisualFeedback } from './ParticipantVisualFeedback';

interface ParticipantCardProps {
  participant: Participant;
  speakingState: SpeakingState;
  onClick?: () => void;
  onPersonaClick?: (participantId: string) => void;
  onPersonaDoubleClick?: (participantId: string) => void;
}

const getAgentTagline = (role: string): string => {
  const roleDescriptions: { [key: string]: string } = {
    'Engagement Manager': 'drives progress & alignment',
    'Strategy Partner': 'provides strategic insights',
    'Research Analyst': 'analyzes data & trends',
    'Financial Advisor': 'offers financial guidance',
    'Technology Consultant': 'bridges tech & business',
    'Operations Consultant': 'optimizes processes',
    'Communications Consultant': 'enhances messaging',
    'Best Friend': 'provides emotional support',
    Cousin: 'offers family wisdom',
    Friend: 'motivates & encourages',
  };

  return roleDescriptions[role] || 'provides expert guidance';
};

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  speakingState,
  onClick,
  onPersonaClick,
  onPersonaDoubleClick,
}) => {
  const isUser = participant.isUser || speakingState === 'user';
  const isSpeaking = participant.isSpeaking || speakingState === 'current';
  const isNextToSpeak = participant.isNextToSpeak || speakingState === 'next';
  const isListening = participant.isListening || false;
  const isUserSpeaking = isUser && (isSpeaking || isListening);

  const participantColor =
    typeof participant.color === 'string' && participant.color.startsWith('#')
      ? participant.color
      : '#888888';

  const { handleClick, isPersonaClickable, isUserClickable } = useParticipantClickHandlers({
    isUser,
    participantId: participant.id,
    onClick,
    onPersonaClick,
    onPersonaDoubleClick,
  });

  return (
    <div
      className={`
        flex flex-col items-center justify-center 
        border rounded-lg p-4 h-full
        transition-all duration-300 ease-in-out
        ${
          isUserSpeaking
            ? 'border-red-400 shadow-lg'
            : isSpeaking
              ? 'border-primary shadow-lg'
              : isNextToSpeak
                ? 'border-indigo-300 shadow-md'
                : 'border-muted'
        }
        ${
          isUserClickable
            ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer'
            : isPersonaClickable
              ? 'hover:bg-primary/10 cursor-pointer hover:border-primary/50'
              : 'bg-opacity-10'
        }
        relative
      `}
      style={
        !isUserClickable && !isPersonaClickable
          ? {
              backgroundColor: `${participantColor}10`,
              ...(isNextToSpeak && !isSpeaking
                ? { borderColor: '#E5DEFF', borderWidth: '2px' }
                : {}),
              ...(isUserSpeaking ? { borderColor: '#F87171', borderWidth: '3px' } : {}),
            }
          : {}
      }
      onClick={handleClick}
      title={
        isUserClickable
          ? 'Click to toggle speech recognition'
          : isPersonaClickable
            ? 'Single click: next in queue | Double click: interrupt current speaker'
            : undefined
      }
    >
      <ParticipantStatusIndicator
        isUser={isUser}
        isSpeaking={isSpeaking}
        isNextToSpeak={isNextToSpeak}
        isListening={isListening}
      />

      <ParticipantVisualFeedback
        isUser={isUser}
        isSpeaking={isSpeaking}
        isNextToSpeak={isNextToSpeak}
        isListening={isListening}
        isUserClickable={isUserClickable}
        isPersonaClickable={isPersonaClickable}
      />

      {/* Avatar */}
      <div
        className={`w-16 h-16 mb-2 border-2 shadow-md rounded-full flex items-center justify-center ${
          isUserSpeaking ? 'border-red-400' : 'border-background'
        }`}
      >
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white text-xl font-medium"
          style={{
            backgroundColor: isUser
              ? isListening
                ? '#F87171'
                : 'var(--primary)'
              : participantColor,
          }}
        >
          {participant.avatar}
        </div>
      </div>

      <div className="text-center">
        <h3 className="font-medium text-sm mb-1">{participant.name}</h3>

        {/* Agent role and tagline */}
        {!isUser && (
          <div className="text-xs text-muted-foreground mb-2 px-1">
            <div className="font-medium">{participant.role}</div>
            <div className="text-[10px] leading-tight opacity-75">
              {getAgentTagline(participant.role)}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center mt-1 gap-1.5">
          <ParticipantStatusBadge
            isUser={isUser}
            isSpeaking={isSpeaking}
            isNextToSpeak={isNextToSpeak}
            isListening={isListening}
          />
        </div>
      </div>
    </div>
  );
};
