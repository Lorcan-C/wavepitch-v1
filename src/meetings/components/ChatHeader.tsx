import React from 'react';

import { Eye, EyeOff, FileText, Mic, MicOff, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Participant, User } from '../types';

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
  meetingId,
  participants,
  user,
  isMuted,
  showSpeakerQueue,
  onToggleMute,
  onToggleSpeakerQueue,
  onShowSummary,
  onEndMeeting,
  onShowExpertPreview,
}) => {
  const allParticipants = [user, ...participants];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Title and ID */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">{meetingTitle}</h1>
          <p className="text-sm text-gray-500">ID: {meetingId}</p>
        </div>

        {/* Center: Participant Avatars */}
        <div className="flex items-center gap-2 mx-8">
          <div className="flex -space-x-2">
            {allParticipants.slice(0, 6).map((participant, index) => (
              <div
                key={participant.id}
                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-sm shadow-sm"
                title={participant.name}
                style={{ zIndex: 10 - index }}
              >
                {participant.avatar}
              </div>
            ))}
            {allParticipants.length > 6 && (
              <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-xs text-white shadow-sm">
                +{allParticipants.length - 6}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Right: Control Buttons */}
        <div className="flex items-center gap-2">
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
