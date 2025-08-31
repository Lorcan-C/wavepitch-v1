import React from 'react';

import { TTSMessageControl } from '@/components/tts/TTSMessageControl';
import { getMessageBubbleColors } from '@/utils/participantColors';

import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.isUser;
  const bubbleColors = getMessageBubbleColors(message.sender, isUser);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`w-4/5 ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Sender name and timestamp */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs font-medium text-gray-600">
            {message.senderName || (isUser ? 'You' : 'Agent')}
          </span>
          <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
          {!isUser && <TTSMessageControl messageId={message.id} />}
        </div>

        {/* Message bubble */}
        <div
          className={`
            px-4 py-3 rounded-lg shadow-sm transition-all duration-200
            ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'text-gray-900 rounded-bl-sm hover:opacity-80'
            }
          `}
          style={
            !isUser
              ? {
                  backgroundColor: bubbleColors.backgroundColor,
                  borderLeft: `3px solid ${bubbleColors.borderColor}`,
                }
              : {}
          }
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
};
