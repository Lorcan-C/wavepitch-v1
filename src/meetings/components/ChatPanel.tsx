import React, { useEffect, useRef, useState } from 'react';

import { MessageSquare, Users } from 'lucide-react';

import { ThinkingIndicator } from '../../components/ui/ThinkingIndicator';
import { KeyboardShortcutHint } from '../../components/ui/keyboard-shortcut-hint';
import { ScrollArea } from '../../components/ui/scroll-area';
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
  currentTranscript?: string;
}

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
  currentTranscript = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Enhanced auto-scroll with user scroll detection
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, streamingMessage, shouldAutoScroll, scrollToBottom]);

  // Detect user scroll to disable auto-scroll temporarily
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px threshold
      setShouldAutoScroll(isAtBottom);
    }
  };

  return (
    <div className="w-full bg-white border-l border-gray-200 h-full flex flex-col">
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
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4" onScrollCapture={handleScroll}>
        <div className="space-y-1">
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
                  <div className="w-4/5">
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
              {/* Show live transcript when speaking */}
              {isMicActive && currentTranscript && (
                <div className="flex justify-end mb-4">
                  <div className="w-4/5">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">Listening...</span>
                    </div>
                    <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-lg rounded-br-sm px-4 py-3">
                      <p className="text-sm leading-relaxed italic">
                        "{currentTranscript}"
                        <span className="inline-block w-2 h-5 bg-red-500 animate-pulse ml-1"></span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Show thinking indicator when loading but not streaming */}
              <ThinkingIndicator
                isLoading={isLoading}
                isStreaming={isStreaming}
                messageCount={messages.length}
              />
            </>
          )}

          {/* Keyboard shortcuts hint */}
          <KeyboardShortcutHint hasMessages={messages.length > 0} />

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
