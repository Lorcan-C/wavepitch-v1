import React from 'react';

import { Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTTSConsent } from '@/hooks/tts/useTTSConsent';

export const TTSHeaderToggle: React.FC = () => {
  const { audioRepliesEnabled, enableAudioReplies, disableAudioReplies } = useTTSConsent();

  const handleToggle = async () => {
    if (audioRepliesEnabled) {
      disableAudioReplies();
    } else {
      await enableAudioReplies();
    }
  };

  return (
    <Button
      variant={audioRepliesEnabled ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleToggle}
      title={
        audioRepliesEnabled ? 'Disable voice replies' : 'Enable voice replies from participants'
      }
    >
      {audioRepliesEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </Button>
  );
};
