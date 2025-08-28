import React from 'react';

import { Participant, SpeakerQueueItem, User } from '../types';
import { SpeakerQueue } from './SpeakerQueue';
import { VideoCallLayout } from './VideoCallLayout';

interface VideoGridWithQueueProps {
  participants: Participant[];
  user: User;
  currentSpeakerId?: string;
  nextSpeakerId?: string;
  showSpeakerQueue: boolean;
  speakerQueue: SpeakerQueueItem[];
  currentSpeakerIndex: number;
  onReshuffle: () => void;
}

export const VideoGridWithQueue: React.FC<VideoGridWithQueueProps> = ({
  participants,
  user,
  currentSpeakerId,
  nextSpeakerId,
  showSpeakerQueue,
  speakerQueue,
  currentSpeakerIndex,
  onReshuffle,
}) => {
  return (
    <div className="h-full relative flex">
      <div className="flex-1">
        <VideoCallLayout
          participants={participants}
          user={user}
          currentSpeakerId={currentSpeakerId}
          nextSpeakerId={nextSpeakerId}
        />
      </div>

      {/* Speaker Queue positioned within video area */}
      {showSpeakerQueue && (
        <SpeakerQueue
          speakers={speakerQueue}
          currentSpeakerIndex={currentSpeakerIndex}
          onReshuffle={onReshuffle}
          isVisible={showSpeakerQueue}
        />
      )}
    </div>
  );
};
