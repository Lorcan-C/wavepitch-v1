import React, { useEffect, useRef } from 'react';

import { MessageSquare, Users } from 'lucide-react';

import { Message } from '../types';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

interface ChatPanelProps {
  messages: Message[];
  participantCount: number;
  isLoading: boolean;
  isMicActive: boolean;
  onSendMessage: (message: string) => void;
  onNextSpeaker: () => void;
  onToggleMic: () => void;
  streamingMessage?: string;
  isStreaming?: boolean;
}

const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
        <span className="text-sm text-gray-600">Thinking...</span>
      </div>
    </div>
  );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  participantCount,
  isLoading,
  isMicActive,
  onSendMessage,
  onNextSpeaker,
  onToggleMic,
  streamingMessage = '',
  isStreaming = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, streamingMessage]);

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Discussion</h3>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700 font-medium">{participantCount}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {/* Show streaming message */}
            {isStreaming && streamingMessage && (
              <div className="flex justify-start mb-4">
                <div className="max-w-xs lg:max-w-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-600">AI Assistant</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                  <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm px-4 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {streamingMessage}
                      <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1"></span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Show thinking indicator when loading but not streaming */}
            {isLoading && !isStreaming && <ThinkingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        onNextSpeaker={onNextSpeaker}
        onToggleMic={onToggleMic}
        isMicActive={isMicActive}
      />
    </div>
  );
};
