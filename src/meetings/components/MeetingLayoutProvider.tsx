import React, { useCallback, useState } from 'react';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { useIsDesktop } from '../hooks/useIsDesktop';
import { Message, Participant, SpeakerQueueItem, User } from '../types';
import { ChatFAB } from './ChatFAB';
import { ChatOverlay } from './ChatOverlay';
import { MeetingChatPanel } from './MeetingChatPanel';
import { VideoGridWithQueue } from './VideoGridWithQueue';

// Secure localStorage wrapper with error handling
const secureStorage = {
  get(key: string, defaultValue: number): number {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : Math.max(25, Math.min(75, parsed)); // Clamp to safe bounds
    } catch {
      return defaultValue;
    }
  },
  set(key: string, value: number): void {
    try {
      const clamped = Math.max(25, Math.min(75, value));
      localStorage.setItem(key, clamped.toString());
    } catch {
      // Silently fail if localStorage unavailable
    }
  },
};

// Input sanitization for user-provided data
const sanitizeString = (input: string): string => {
  return input.replace(/[<>'"&]/g, ''); // Basic XSS prevention
};

const sanitizeParticipant = (participant: Participant): Participant => ({
  ...participant,
  name: sanitizeString(participant.name),
  role: sanitizeString(participant.role),
  description: participant.description ? sanitizeString(participant.description) : undefined,
});

const sanitizeMessage = (message: Message): Message => ({
  ...message,
  content: sanitizeString(message.content),
  senderName: message.senderName ? sanitizeString(message.senderName) : undefined,
});

interface MeetingLayoutProviderProps {
  participants: Participant[];
  user: User;
  messages: Message[];
  messagesWithAudio: Message[];
  currentSpeakerId?: string;
  nextSpeakerId?: string;
  currentSpeakerIndex: number;
  showSpeakerQueue: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  isMicActive: boolean;
  streamingMessage: string;
  onSendMessage: (content: string) => void;
  onNextSpeaker: () => void;
  onToggleMic: () => void;
  onReshuffle: () => void;
}

// Error boundary for layout failures
class LayoutErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Layout error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DesktopLayout: React.FC<{
  participants: Participant[];
  user: User;
  messagesWithAudio: Message[];
  currentSpeakerId?: string;
  nextSpeakerId?: string;
  currentSpeakerIndex: number;
  showSpeakerQueue: boolean;
  speakerQueue: SpeakerQueueItem[];
  totalParticipants: number;
  isLoading: boolean;
  isStreaming: boolean;
  isMicActive: boolean;
  streamingMessage: string;
  chatPanelSize: number;
  onSendMessage: (content: string) => void;
  onNextSpeaker: () => void;
  onToggleMic: () => void;
  onReshuffle: () => void;
  onChatPanelResize: (sizes: number[]) => void;
}> = ({
  participants,
  user,
  messagesWithAudio,
  currentSpeakerId,
  nextSpeakerId,
  currentSpeakerIndex,
  showSpeakerQueue,
  speakerQueue,
  totalParticipants,
  isLoading,
  isStreaming,
  isMicActive,
  streamingMessage,
  chatPanelSize,
  onSendMessage,
  onNextSpeaker,
  onToggleMic,
  onReshuffle,
  onChatPanelResize,
}) => (
  <PanelGroup
    direction="horizontal"
    onLayout={onChatPanelResize}
    className="h-full"
    role="main"
    aria-label="Meeting interface"
  >
    {/* Left Panel: Video Layout */}
    <Panel
      defaultSize={100 - chatPanelSize}
      minSize={25}
      maxSize={75}
      className="overflow-hidden"
      aria-label="Video and participants panel"
    >
      <VideoGridWithQueue
        participants={participants}
        user={user}
        currentSpeakerId={currentSpeakerId}
        nextSpeakerId={nextSpeakerId}
        showSpeakerQueue={showSpeakerQueue}
        speakerQueue={speakerQueue}
        currentSpeakerIndex={currentSpeakerIndex}
        onReshuffle={onReshuffle}
      />
    </Panel>

    {/* Resizable Handle */}
    <PanelResizeHandle
      className="w-2 bg-border hover:bg-primary/20 transition-colors duration-200"
      aria-label="Resize panels"
    />

    {/* Right Panel: Chat */}
    <Panel
      defaultSize={chatPanelSize}
      minSize={25}
      maxSize={75}
      className="overflow-hidden"
      aria-label="Chat panel"
    >
      <MeetingChatPanel
        messages={messagesWithAudio}
        totalParticipants={totalParticipants}
        isLoading={isLoading}
        isStreaming={isStreaming}
        isMicActive={isMicActive}
        streamingMessage={streamingMessage}
        onSendMessage={onSendMessage}
        onNextSpeaker={onNextSpeaker}
        onToggleMic={onToggleMic}
      />
    </Panel>
  </PanelGroup>
);

const MobileLayout: React.FC<{
  participants: Participant[];
  user: User;
  messages: Message[];
  currentSpeakerId?: string;
  nextSpeakerId?: string;
  currentSpeakerIndex: number;
  showSpeakerQueue: boolean;
  speakerQueue: SpeakerQueueItem[];
  totalParticipants: number;
  isLoading: boolean;
  isStreaming: boolean;
  isMicActive: boolean;
  streamingMessage: string;
  isChatOpen: boolean;
  onSendMessage: (content: string) => void;
  onNextSpeaker: () => void;
  onToggleMic: () => void;
  onReshuffle: () => void;
  onSetChatOpen: (open: boolean) => void;
}> = ({
  participants,
  user,
  messages,
  currentSpeakerId,
  nextSpeakerId,
  currentSpeakerIndex,
  showSpeakerQueue,
  speakerQueue,
  totalParticipants,
  isLoading,
  isStreaming,
  isMicActive,
  streamingMessage,
  isChatOpen,
  onSendMessage,
  onNextSpeaker,
  onToggleMic,
  onReshuffle,
  onSetChatOpen,
}) => (
  <>
    {/* Video Grid */}
    <VideoGridWithQueue
      participants={participants}
      user={user}
      currentSpeakerId={currentSpeakerId}
      nextSpeakerId={nextSpeakerId}
      showSpeakerQueue={showSpeakerQueue}
      speakerQueue={speakerQueue}
      currentSpeakerIndex={currentSpeakerIndex}
      onReshuffle={onReshuffle}
    />

    {/* Mobile Chat FAB */}
    {!isChatOpen && (
      <ChatFAB
        onClick={() => onSetChatOpen(true)}
        unreadCount={0} // TODO: Add unread message tracking
        aria-label="Open chat"
      />
    )}

    {/* Mobile Chat Overlay */}
    {isChatOpen && (
      <ChatOverlay onClose={() => onSetChatOpen(false)}>
        <MeetingChatPanel
          messages={messages}
          totalParticipants={totalParticipants}
          isLoading={isLoading}
          isStreaming={isStreaming}
          isMicActive={isMicActive}
          streamingMessage={streamingMessage}
          onSendMessage={onSendMessage}
          onNextSpeaker={onNextSpeaker}
          onToggleMic={onToggleMic}
        />
      </ChatOverlay>
    )}
  </>
);

export const MeetingLayoutProvider: React.FC<MeetingLayoutProviderProps> = ({
  participants,
  user,
  messages,
  messagesWithAudio,
  currentSpeakerId,
  nextSpeakerId,
  currentSpeakerIndex,
  showSpeakerQueue,
  isLoading,
  isStreaming,
  isMicActive,
  streamingMessage,
  onSendMessage,
  onNextSpeaker,
  onToggleMic,
  onReshuffle,
}) => {
  const isDesktop = useIsDesktop();

  // Secure state management
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPanelSize, setChatPanelSize] = useState(() =>
    secureStorage.get('meetingChatPanelSize', 40),
  );

  // Secure panel resize handler with validation
  const handleChatPanelResize = useCallback((sizes: number[]) => {
    if (!Array.isArray(sizes) || sizes.length < 2) return;

    const chatSize = sizes[1];
    if (typeof chatSize !== 'number' || isNaN(chatSize)) return;

    setChatPanelSize(chatSize);
    secureStorage.set('meetingChatPanelSize', chatSize);
  }, []);

  // Sanitize and validate input data
  const sanitizedParticipants = participants.map(sanitizeParticipant);
  const sanitizedMessages = messages.map(sanitizeMessage);
  const sanitizedMessagesWithAudio = messagesWithAudio.map(sanitizeMessage);
  const sanitizedUser = {
    ...user,
    name: sanitizeString(user.name),
  };

  // Generate secure speaker queue with validation
  const speakerQueue: SpeakerQueueItem[] = [
    { id: sanitizedUser.id, name: sanitizedUser.name, avatar: sanitizedUser.avatar, position: 0 },
    ...sanitizedParticipants.map((p, index) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      position: index + 1,
    })),
  ];

  const totalParticipants = Math.max(0, sanitizedParticipants.length + 1);

  // Error fallback component
  const errorFallback = (
    <div className="flex items-center justify-center h-full bg-gray-100" role="alert">
      <div className="text-center p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Layout Error</h2>
        <p className="text-gray-600">Unable to load meeting interface. Please refresh the page.</p>
      </div>
    </div>
  );

  return (
    <LayoutErrorBoundary fallback={errorFallback}>
      {isDesktop ? (
        <DesktopLayout
          participants={sanitizedParticipants}
          user={sanitizedUser}
          messagesWithAudio={sanitizedMessagesWithAudio}
          currentSpeakerId={currentSpeakerId}
          nextSpeakerId={nextSpeakerId}
          currentSpeakerIndex={currentSpeakerIndex}
          showSpeakerQueue={showSpeakerQueue}
          speakerQueue={speakerQueue}
          totalParticipants={totalParticipants}
          isLoading={isLoading}
          isStreaming={isStreaming}
          isMicActive={isMicActive}
          streamingMessage={streamingMessage}
          chatPanelSize={chatPanelSize}
          onSendMessage={onSendMessage}
          onNextSpeaker={onNextSpeaker}
          onToggleMic={onToggleMic}
          onReshuffle={onReshuffle}
          onChatPanelResize={handleChatPanelResize}
        />
      ) : (
        <MobileLayout
          participants={sanitizedParticipants}
          user={sanitizedUser}
          messages={sanitizedMessages}
          currentSpeakerId={currentSpeakerId}
          nextSpeakerId={nextSpeakerId}
          currentSpeakerIndex={currentSpeakerIndex}
          showSpeakerQueue={showSpeakerQueue}
          speakerQueue={speakerQueue}
          totalParticipants={totalParticipants}
          isLoading={isLoading}
          isStreaming={isStreaming}
          isMicActive={isMicActive}
          streamingMessage={streamingMessage}
          isChatOpen={isChatOpen}
          onSendMessage={onSendMessage}
          onNextSpeaker={onNextSpeaker}
          onToggleMic={onToggleMic}
          onReshuffle={onReshuffle}
          onSetChatOpen={setIsChatOpen}
        />
      )}
    </LayoutErrorBoundary>
  );
};
