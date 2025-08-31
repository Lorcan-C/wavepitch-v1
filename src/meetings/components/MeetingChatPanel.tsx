import React from 'react';

import { Message } from '../types';
import { ChatPanel } from './ChatPanel';

interface MeetingChatPanelProps {
  messages: Message[];
  totalParticipants: number;
  isLoading: boolean;
  isStreaming: boolean;
  isMicActive: boolean;
  streamingMessage: string;
  currentTranscript?: string;
  onSendMessage: (content: string) => void;
  onNextSpeaker: () => void;
  onToggleMic: () => void;
}

export const MeetingChatPanel: React.FC<MeetingChatPanelProps> = ({
  messages,
  totalParticipants,
  isLoading,
  isStreaming,
  isMicActive,
  streamingMessage,
  currentTranscript,
  onSendMessage,
  onNextSpeaker,
  onToggleMic,
}) => {
  return (
    <ChatPanel
      messages={messages}
      participantCount={totalParticipants}
      isLoading={isLoading || isStreaming}
      isMicActive={isMicActive}
      onSendMessage={onSendMessage}
      onNextSpeaker={onNextSpeaker}
      onToggleMic={onToggleMic}
      streamingMessage={streamingMessage}
      isStreaming={isStreaming}
      currentTranscript={currentTranscript}
    />
  );
};
