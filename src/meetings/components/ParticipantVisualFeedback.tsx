import React from 'react';

import { Mic } from 'lucide-react';

interface ParticipantVisualFeedbackProps {
  isUser: boolean;
  isSpeaking: boolean;
  isNextToSpeak: boolean;
  isListening: boolean;
  isUserClickable: boolean;
  isPersonaClickable: boolean;
}

export const ParticipantVisualFeedback: React.FC<ParticipantVisualFeedbackProps> = ({
  isUser,
  isSpeaking,
  isNextToSpeak,
  isListening,
  isUserClickable,
  isPersonaClickable,
}) => {
  const isUserSpeaking = isUser && (isSpeaking || isListening);

  return (
    <>
      {/* Pulse ring animation for speaking participants */}
      <div
        className={`absolute inset-0 rounded-lg ${
          isUserSpeaking
            ? 'ring-4 ring-red-400 animate-pulse'
            : isSpeaking
              ? 'ring-4 ring-primary animate-pulse'
              : isNextToSpeak
                ? 'ring-4 ring-indigo-200 animate-pulse'
                : ''
        }`}
      />

      {/* Clickable hint for user box */}
      {isUserClickable && !isSpeaking && !isListening && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
          Click to speak
        </div>
      )}

      {/* Clickable hint for persona boxes */}
      {isPersonaClickable && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded-full">
          <div className="text-center">
            <div>1× Next</div>
            <div>2× Interrupt</div>
          </div>
        </div>
      )}

      {/* Visual feedback during voice recognition */}
      {isUserSpeaking && (
        <div className="absolute inset-0 bg-red-50/30 rounded-lg pointer-events-none flex items-center justify-center">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-25"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Mic size={32} className="text-red-500 animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
