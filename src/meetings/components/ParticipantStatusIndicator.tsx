import React from 'react';

import { ArrowRight, Keyboard, Mic, Volume2 } from 'lucide-react';

interface ParticipantStatusIndicatorProps {
  isUser: boolean;
  isSpeaking: boolean;
  isNextToSpeak: boolean;
  isListening: boolean;
}

export const ParticipantStatusIndicator: React.FC<ParticipantStatusIndicatorProps> = ({
  isUser,
  isSpeaking,
  isNextToSpeak,
  isListening,
}) => {
  if (isUser && isListening) {
    return (
      <div className="absolute top-0 left-0 right-0 bg-red-400 px-3 py-1 rounded-t-lg flex items-center justify-center gap-1.5 z-20">
        <div className="flex items-center gap-1.5 w-full justify-center">
          <Mic size={16} className="text-white animate-pulse" />
          <span className="text-xs font-medium text-white">Listening...</span>
        </div>
      </div>
    );
  }

  if (isSpeaking && !isListening) {
    return (
      <div className="absolute top-0 left-0 right-0 bg-primary px-3 py-1 rounded-t-lg flex items-center justify-center gap-1.5 z-10">
        <div className="flex items-center gap-1.5 w-full justify-center">
          {isUser ? (
            <Mic size={16} className="text-white animate-pulse" />
          ) : (
            <Volume2 size={16} className="text-white animate-pulse" />
          )}
          <span className="text-xs font-medium text-white">Speaking</span>
        </div>
      </div>
    );
  }

  if (isNextToSpeak && !isSpeaking && !isListening) {
    return (
      <div className="absolute top-0 left-0 right-0 bg-indigo-300 px-3 py-1 rounded-t-lg flex items-center justify-center gap-1.5 z-10">
        <div className="flex items-center gap-1.5 w-full justify-center">
          <ArrowRight size={16} className="text-indigo-700" />
          <span className="text-xs font-medium text-indigo-700 flex items-center gap-1">
            Speaking Next{' '}
            <span className="bg-white px-1 rounded text-xs ml-1 flex items-center">
              <Keyboard size={10} className="mr-0.5" />X
            </span>
          </span>
        </div>
      </div>
    );
  }

  return null;
};
