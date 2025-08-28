import React from 'react';

import { ArrowRight, Keyboard, Mic, Volume2 } from 'lucide-react';

interface ParticipantStatusBadgeProps {
  isUser: boolean;
  isSpeaking: boolean;
  isNextToSpeak: boolean;
  isListening: boolean;
}

export const ParticipantStatusBadge: React.FC<ParticipantStatusBadgeProps> = ({
  isUser,
  isSpeaking,
  isNextToSpeak,
  isListening,
}) => {
  const isUserSpeaking = isUser && (isSpeaking || isListening);

  if (isUserSpeaking) {
    return (
      <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
        <Mic size={14} className="animate-pulse" />
        <span className="text-xs font-medium">Listening...</span>
      </div>
    );
  }

  if (isSpeaking) {
    return (
      <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse">
        {isUser ? (
          <Mic size={14} className="animate-pulse" />
        ) : (
          <Volume2 size={14} className="animate-pulse" />
        )}
        <span className="text-xs font-medium">Speaking</span>
      </div>
    );
  }

  if (isNextToSpeak) {
    return (
      <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
        <ArrowRight size={14} />
        <span className="text-xs font-medium flex items-center">
          Up Next{' '}
          <span className="bg-white px-1 rounded text-[10px] ml-1 flex items-center">
            <Keyboard size={8} className="mr-0.5" />X
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
      <span className="text-xs">Ready</span>
    </div>
  );
};
