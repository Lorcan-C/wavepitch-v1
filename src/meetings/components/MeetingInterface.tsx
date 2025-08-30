import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';

import { ExpertPreviewDialog } from '@/components/meeting/ExpertPreviewDialog';
import { useClerkSupabase } from '@/hooks/useClerkSupabase';
import { useMessageAudio } from '@/hooks/useMessageAudio';
import { voiceAssigner } from '@/services/voice';
import { useMeetingStore } from '@/stores/meeting-store';

import { MeetingSummaryDialog } from '../../components/meetings/MeetingSummaryDialog';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { meetingSummaryService } from '../../services/MeetingSummaryService';
import { MeetingSummary, Message, Participant, User } from '../types';
import { ChatHeader } from './ChatHeader';
import { MeetingLayoutProvider } from './MeetingLayoutProvider';

interface MeetingInterfaceProps {
  meetingId: string;
  meetingTitle: string;
  participants: Participant[];
  user: User;
  messages: Message[];
  currentSpeakerId?: string;
  nextSpeakerId?: string;
}

export const MeetingInterface: React.FC<MeetingInterfaceProps> = ({
  meetingId,
  meetingTitle,
  participants,
  user,
  messages: initialMessages,
  currentSpeakerId,
  nextSpeakerId,
}) => {
  const navigate = useNavigate();

  // Clerk-Supabase integration
  const { isAuthenticated, saveMeeting } = useClerkSupabase();
  const { endMeeting, getMeetingData } = useMeetingStore();

  // UI State
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeakerQueue, setShowSpeakerQueue] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [meetingStartTime] = useState<string>(new Date().toISOString());

  // Sync messages with prop changes
  useEffect(() => {
    console.log(
      'MeetingInterface: Syncing messages with prop changes',
      initialMessages.length,
      'messages',
    );
    setMessages(initialMessages);
  }, [initialMessages]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string>(meetingId);

  // Expert preview dialog state
  const [showExpertPreview, setShowExpertPreview] = useState(true);

  // Summary dialog state
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState<MeetingSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Streaming state for real-time AI responses
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Context management for token optimization
  const [conversationContext, setConversationContext] = useState({
    currentPhase: 'discussion',
    tokenUsage: 0,
    lastTruncation: null as number | null,
  });

  // Audio integration - automatically generates and plays audio for new messages
  const { messagesWithAudio } = useMessageAudio(messages, sessionId || meetingId, participants, {
    autoPlay: !isMuted,
  });

  // Initialize meeting context on mount
  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        // Update meeting context with current participants
        await fetch('/api/messages/in-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId || meetingId,
            type: 'update-context',
            updates: {
              experts: participants.map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
                expertise: p.role, // Using role as expertise for now
              })),
              meetingContext: meetingTitle,
              currentPhase: conversationContext.currentPhase,
            },
          }),
        });

        // Assign voices to AI participants
        voiceAssigner.assignVoices(meetingId, participants);
        console.log('Voice assignments created for session:', meetingId);

        setSessionId(meetingId);
      } catch (error) {
        console.error('Failed to initialize meeting context:', error);
      }
    };

    if (meetingId && participants.length > 0) {
      initializeMeeting();
    }
  }, [meetingId, participants, meetingTitle, conversationContext.currentPhase, sessionId]);

  // Streaming text handler based on research recommendations
  const handleStreamingResponse = useCallback(
    async (response: Response, expertId: string, expertName: string) => {
      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      setIsStreaming(true);
      setStreamingMessage('');

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;
          setStreamingMessage(streamedContent);
        }

        // Add completed message to conversation
        const completedMessage: Message = {
          id: Date.now().toString(),
          content: streamedContent,
          sender: expertId,
          isUser: false,
          timestamp: Date.now(),
          senderName: expertName,
        };

        setMessages((prev) => [...prev, completedMessage]);
        setStreamingMessage('');
      } catch (error) {
        console.error('Streaming error:', error);
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  // Context-aware message truncation (research recommendation)
  const truncateContextIfNeeded = useCallback((currentMessages: Message[]) => {
    const MAX_MESSAGES = 20; // Keep last 20 messages for context
    if (currentMessages.length > MAX_MESSAGES) {
      const truncated = currentMessages.slice(-MAX_MESSAGES);
      setConversationContext((prev) => ({
        ...prev,
        lastTruncation: Date.now(),
      }));
      return truncated;
    }
    return currentMessages;
  }, []);

  // Enhanced message handler using existing API endpoints
  const handleSendMessage = useCallback(
    async (content: string) => {
      console.log('Sending message:', content);

      // Cancel any ongoing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: user.id,
        isUser: true,
        timestamp: Date.now(),
        senderName: user.name,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Get current speaker (next in queue)
      const currentExpert = participants[currentSpeakerIndex % participants.length];
      if (!currentExpert) return;

      setIsLoading(true);

      try {
        // Truncate context for token optimization
        const contextMessages = truncateContextIfNeeded(updatedMessages);

        // Call existing in-meeting API
        const response = await fetch('/api/messages/in-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId || meetingId,
            type: 'generate-response',
            expertId: currentExpert.id,
            conversationHistory: contextMessages.map((msg) => ({
              sender: msg.senderName,
              message: msg.content,
              timestamp: msg.timestamp,
              isUser: msg.isUser,
            })),
            currentPhase: conversationContext.currentPhase,
            userMessage: content,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (response.ok) {
          await handleStreamingResponse(response, currentExpert.id, currentExpert.name);
          // Advance to next speaker
          setCurrentSpeakerIndex((prev) => (prev + 1) % participants.length);
        } else {
          throw new Error(`API responded with status ${response.status}`);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to generate AI response:', error);
          // Add error message to conversation
          const errorMessage: Message = {
            id: Date.now().toString(),
            content: "Sorry, I'm having trouble responding right now. Please try again.",
            sender: currentExpert.id,
            isUser: false,
            timestamp: Date.now(),
            senderName: currentExpert.name,
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      user,
      participants,
      currentSpeakerIndex,
      sessionId,
      meetingId,
      conversationContext.currentPhase,
      truncateContextIfNeeded,
      handleStreamingResponse,
    ],
  );

  // Enhanced next speaker with advance-speaker API integration
  const handleNextSpeaker = useCallback(async () => {
    console.log('Next speaker requested');

    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const currentExpert = participants[currentSpeakerIndex % participants.length];

    try {
      // Use existing advance-speaker API for intelligent transitions
      const response = await fetch('/api/messages/in-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || meetingId,
          type: 'advance-speaker',
          currentSpeaker: currentExpert?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Find next speaker index
        const nextSpeakerIndex = participants.findIndex((p) => p.id === data.nextSpeaker);
        if (nextSpeakerIndex !== -1) {
          setCurrentSpeakerIndex(nextSpeakerIndex);
        }

        // Add pre-generated response if available
        if (data.preGeneratedResponse) {
          const transitionMessage: Message = {
            id: Date.now().toString(),
            content: data.preGeneratedResponse,
            sender: data.nextSpeaker,
            isUser: false,
            timestamp: Date.now(),
            senderName: data.nextSpeakerName,
          };
          setMessages((prev) => [...prev, transitionMessage]);
        }
      } else {
        // Fallback to simple rotation
        setCurrentSpeakerIndex((prev) => (prev + 1) % participants.length);
      }
    } catch (error) {
      console.error('Failed to advance speaker:', error);
      // Fallback to simple rotation
      setCurrentSpeakerIndex((prev) => (prev + 1) % participants.length);
    }
  }, [participants, currentSpeakerIndex, sessionId, meetingId]);

  const handleToggleMic = () => {
    console.log('Mic toggled');
    setIsMicActive((prev) => !prev);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'KeyL',
      handler: handleNextSpeaker,
      description: 'Skip to next speaker',
    },
    {
      key: 'Space',
      handler: handleToggleMic,
      description: 'Toggle microphone',
    },
  ]);

  const handleToggleMute = () => {
    console.log('Mute toggled');
    setIsMuted((prev) => !prev);
  };

  const handleToggleSpeakerQueue = () => {
    console.log('Speaker queue toggled');
    setShowSpeakerQueue((prev) => !prev);
  };

  const handleShowSummary = async () => {
    if (messages.length === 0) {
      toast.info('No messages to summarize yet');
      return;
    }

    setSummaryDialogOpen(true);
    setIsGeneratingSummary(true);
    setMeetingSummary(null);

    try {
      const summary = await meetingSummaryService.generateMeetingSummary(messages);
      setMeetingSummary(summary);
      toast.success('Meeting summary generated');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate meeting summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEndMeeting = async () => {
    console.log('End meeting requested');
    if (window.confirm('Are you sure you want to end this meeting?')) {
      try {
        if (!isAuthenticated) {
          toast.error('Authentication required to save meeting');
          navigate('/app');
          return;
        }

        // End the meeting in store
        await endMeeting();

        // Get meeting data and save
        const meetingData = getMeetingData();
        const saved = await saveMeeting(meetingData);

        if (saved) {
          toast.success('Meeting saved successfully');
        } else {
          toast.error('Failed to save meeting');
        }

        // Cleanup voice assignments
        voiceAssigner.clearSession(sessionId || meetingId);
        console.log('Voice assignments cleared for session');
        navigate('/app');
      } catch (error) {
        console.error('Failed to end meeting:', error);
        toast.error('Error ending meeting');
        navigate('/app');
      }
    }
  };

  const handleReshuffle = () => {
    console.log('Reshuffle queue requested');
    setCurrentSpeakerIndex(0);
  };

  const handleShowExpertPreview = () => {
    console.log('Show expert preview requested');
    setShowExpertPreview(true);
  };

  return (
    <div className="flex justify-center h-screen overflow-hidden">
      <div className="w-full max-w-[90rem] flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <ChatHeader
          meetingTitle={meetingTitle}
          meetingId={meetingId}
          participants={participants}
          user={user}
          isMuted={isMuted}
          showSpeakerQueue={showSpeakerQueue}
          meetingStartTime={meetingStartTime}
          onToggleMute={handleToggleMute}
          onToggleSpeakerQueue={handleToggleSpeakerQueue}
          onShowSummary={handleShowSummary}
          onEndMeeting={handleEndMeeting}
          onShowExpertPreview={handleShowExpertPreview}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <MeetingLayoutProvider
            participants={participants}
            user={user}
            messages={messages}
            messagesWithAudio={messagesWithAudio}
            currentSpeakerId={currentSpeakerId}
            nextSpeakerId={nextSpeakerId}
            currentSpeakerIndex={currentSpeakerIndex}
            showSpeakerQueue={showSpeakerQueue}
            isLoading={isLoading}
            isStreaming={isStreaming}
            isMicActive={isMicActive}
            streamingMessage={streamingMessage}
            onSendMessage={handleSendMessage}
            onNextSpeaker={handleNextSpeaker}
            onToggleMic={handleToggleMic}
            onReshuffle={handleReshuffle}
          />
        </div>

        {/* Expert Preview Dialog */}
        <ExpertPreviewDialog open={showExpertPreview} onOpenChange={setShowExpertPreview} />

        {/* Meeting Summary Dialog */}
        <MeetingSummaryDialog
          isOpen={summaryDialogOpen}
          onClose={() => setSummaryDialogOpen(false)}
          summary={meetingSummary}
          isLoading={isGeneratingSummary}
          meetingTitle={meetingTitle}
        />
      </div>
    </div>
  );
};
