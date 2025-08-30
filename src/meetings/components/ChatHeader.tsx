import React from 'react';

import { Eye, EyeOff, FileText, Mic, MicOff, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { Participant, User } from '../types';

interface ChatHeaderProps {
  meetingTitle: string;
  meetingId: string;
  participants: Participant[];
  user: User;
  isMuted: boolean;
  showSpeakerQueue: boolean;
  onToggleMute: () => void;
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
  isMuted,
  showSpeakerQueue,
  onToggleMute,
  onToggleSpeakerQueue,
  onShowSummary,
  onEndMeeting,
  onShowExpertPreview,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 truncate">{meetingTitle}</h1>
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

          {/* Mute/Unmute */}
          <Button
            variant={isMuted ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => {
              console.log('Mute toggle clicked');
              onToggleMute();
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

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
