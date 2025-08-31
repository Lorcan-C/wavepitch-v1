import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';

import { ExpertPreviewDialog } from '@/components/meeting/ExpertPreviewDialog';
import { useClerkSupabase } from '@/hooks/useClerkSupabase';
import { useMeetingSTT } from '@/hooks/useMeetingSTT';
// import { useMessageAudio } from '@/hooks/useMessageAudio'; // Disabled - using TTSTextProcessingService instead
import { MeetingDataCollector } from '@/services/MeetingDataCollector';
import { NextSpeakerService } from '@/services/NextSpeakerService';
import { TTSVoiceSelectionService } from '@/services/TTSVoiceSelectionService';
import { voiceAssigner } from '@/services/voice';
import { useMeetingStore } from '@/stores/meeting-store';
import { useTTSStore } from '@/stores/tts-store';

import { MeetingSummaryDialog } from '../../components/meetings/MeetingSummaryDialog';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
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
  const { isAuthenticated, userId } = useClerkSupabase();
  const { endMeeting, getMeetingData } = useMeetingStore();

  // TTS integration
  const { audioRepliesEnabled } = useTTSStore();

  // UI State
  const [showSpeakerQueue, setShowSpeakerQueue] = useState(false);
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

  const abortControllerRef = useRef<AbortController | null>(null);

  // Audio integration - disabled in favor of TTSTextProcessingService
  // const { messagesWithAudio } = useMessageAudio(messages, sessionId || meetingId, participants);
  const messagesWithAudio = messages;

  // STT integration for voice input
  const {
    isRecording,
    isTranscribing,
    currentTranscript,
    startSession: startSTT,
    stopSession: stopSTT,
    resetTranscript,
  } = useMeetingSTT({
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        // Send final transcript as message
        handleSendMessage(text.trim());
        resetTranscript();
      }
    },
    onError: (error) => {
      console.error('STT Error:', error);
      toast.error(`Voice input error: ${error}`);
    },
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
              currentPhase: 'discussion',
            },
          }),
        });

        // Assign voices to AI participants for TTS
        TTSVoiceSelectionService.assignVoices(participants);
        console.log('TTS voice assignments created for participants');

        setSessionId(meetingId);
      } catch (error) {
        console.error('Failed to initialize meeting context:', error);
      }
    };

    if (meetingId && participants.length > 0) {
      initializeMeeting();
    }
  }, [meetingId, participants, meetingTitle, sessionId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      await NextSpeakerService.generateNextMessage({
        participants,
        currentSpeakerIndex,
        messages,
        sessionId: sessionId || meetingId,
        meetingId,
        meetingTitle,
        audioRepliesEnabled,
        user,
        userMessage: content,
        abortController: abortControllerRef.current,
        onSpeakerIndexChange: setCurrentSpeakerIndex,
        onMessageAdd: (message) => setMessages((prev) => [...prev, message]),
        onSetMessages: setMessages,
        onSetLoading: setIsLoading,
      });
    },
    [
      participants,
      currentSpeakerIndex,
      messages,
      sessionId,
      meetingId,
      meetingTitle,
      audioRepliesEnabled,
      user,
    ],
  );

  const handleNextSpeaker = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    await NextSpeakerService.generateNextMessage({
      participants,
      currentSpeakerIndex,
      messages,
      sessionId: sessionId || meetingId,
      meetingId,
      meetingTitle,
      audioRepliesEnabled,
      abortController: abortControllerRef.current,
      onSpeakerIndexChange: setCurrentSpeakerIndex,
      onMessageAdd: (message) => setMessages((prev) => [...prev, message]),
      onSetMessages: setMessages,
      onSetLoading: setIsLoading,
    });
  }, [
    participants,
    currentSpeakerIndex,
    messages,
    sessionId,
    meetingId,
    meetingTitle,
    audioRepliesEnabled,
  ]);

  const handleToggleMic = useCallback(async () => {
    console.log('Mic toggled');

    if (isRecording || isTranscribing) {
      // Stop recording and transcription
      await stopSTT();
    } else {
      // Start recording and transcription
      try {
        await startSTT();
      } catch (error) {
        console.error('Failed to start voice input:', error);
        toast.error('Failed to start voice input');
      }
    }
  }, [isRecording, isTranscribing, startSTT, stopSTT]);

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
      // TODO: Implement summary generation via API call
      const summary = {
        keyIdeas: ['Summary generation disabled'],
        strategicQuestions: [],
        decisions: [],
      };
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

        // Collect and save meeting data using new service
        const meetingData = getMeetingData();

        const completeMeetingData = await MeetingDataCollector.collect(
          meetingData.meetingId,
          meetingData.sessionId,
          meetingData.meetingTitle,
          meetingData.participants,
          meetingData.messages,
          meetingData.meetingStartTime || new Date().toISOString(),
          meetingData.meetingEndTime || new Date().toISOString(),
        );

        const saved = await MeetingDataCollector.saveToSupabase(completeMeetingData, userId!);

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
          showSpeakerQueue={showSpeakerQueue}
          meetingStartTime={meetingStartTime}
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
            isStreaming={false}
            isMicActive={isRecording || isTranscribing}
            streamingMessage=""
            currentTranscript={currentTranscript}
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
