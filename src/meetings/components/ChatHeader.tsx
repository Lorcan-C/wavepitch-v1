import React, { useEffect, useState } from 'react';

import { useAuth } from '@clerk/clerk-react';
import { Eye, EyeOff, FileText, Users, X } from 'lucide-react';

import { MeetingTimer } from '@/components/MeetingTimer';
import { SaveTranscriptButton } from '@/components/meeting/SaveTranscriptButton';
import { TTSHeaderToggle } from '@/components/tts/TTSHeaderToggle';
import { Button } from '@/components/ui/button';
import { generateMeetingTopic } from '@/lib/meeting-topic-generator';

import type { Participant, User } from '../types';

interface ChatHeaderProps {
  meetingTitle: string;
  meetingId: string;
  participants: Participant[];
  user: User;
  showSpeakerQueue: boolean;
  meetingStartTime: string | null;
  onToggleSpeakerQueue: () => void;
  onShowSummary: () => void;
  onEndMeeting: () => void;
  onShowExpertPreview: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  meetingTitle,
  meetingId: _meetingId, // eslint-disable-line @typescript-eslint/no-unused-vars
  participants: _participants, // eslint-disable-line @typescript-eslint/no-unused-vars
  user: _user, // eslint-disable-line @typescript-eslint/no-unused-vars
  showSpeakerQueue,
  meetingStartTime,
  onToggleSpeakerQueue,
  onShowSummary,
  onEndMeeting,
  onShowExpertPreview,
}) => {
  const { getToken } = useAuth();
  const [generatedTopic, setGeneratedTopic] = useState<string>('');

  // Generate AI topic on mount
  useEffect(() => {
    const loadTopic = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // Get stored session data to extract pitch description
        const storedSession = sessionStorage.getItem('meetingSession');
        if (!storedSession) return;

        const sessionData = JSON.parse(storedSession);
        const pitchDescription = sessionData.meetingData?.pitchDescription || meetingTitle;

        const topic = await generateMeetingTopic(pitchDescription, 'discussion', token);
        setGeneratedTopic(topic);
      } catch (error) {
        console.error('Failed to generate meeting topic:', error);
        setGeneratedTopic('Business Discussion');
      }
    };

    loadTopic();
  }, [meetingTitle, getToken]);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Title and Timer */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900 truncate">
            {generatedTopic || meetingTitle}
          </h1>
          <MeetingTimer startTime={meetingStartTime} className="text-gray-500" />
        </div>

        {/* Right: Control Buttons */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {/* View Experts */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('View experts clicked');
              onShowExpertPreview();
            }}
            title="View Meeting Experts"
          >
            <Users className="h-4 w-4" />
          </Button>

          {/* Save Transcript Button */}
          <SaveTranscriptButton />

          {/* TTS Toggle */}
          <TTSHeaderToggle />

          {/* Toggle Speaker Queue */}
          <Button
            variant={showSpeakerQueue ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              console.log('Speaker queue toggle clicked');
              onToggleSpeakerQueue();
            }}
            title={showSpeakerQueue ? 'Hide Speaker Queue' : 'Show Speaker Queue'}
          >
            {showSpeakerQueue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <Users className="h-4 w-4 ml-1" />
          </Button>

          {/* Show Summary */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Show summary clicked');
              onShowSummary();
            }}
            title="Show Meeting Summary"
          >
            <FileText className="h-4 w-4" />
          </Button>

          {/* End Meeting */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              console.log('End meeting clicked');
              onEndMeeting();
            }}
            title="End Meeting"
          >
            <X className="h-4 w-4" />
            End
          </Button>
        </div>
      </div>
    </div>
  );
};
