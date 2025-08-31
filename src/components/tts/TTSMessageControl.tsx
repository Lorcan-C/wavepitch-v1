import React, { useState } from 'react';

import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';

const WaveformIcon: React.FC = () => (
  <div className="flex items-center gap-0.5">
    <div className="w-0.5 h-2 bg-current" />
    <div className="w-0.5 h-3 bg-current" />
    <div className="w-0.5 h-1.5 bg-current" />
    <div className="w-0.5 h-2.5 bg-current" />
  </div>
);

export const TTSMessageControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    console.log(`TTS: ${isPlaying ? 'Pause' : 'Play'} clicked`);
    setIsPlaying(!isPlaying);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
      title={isPlaying ? 'Pause audio' : 'Play audio'}
    >
      {isPlaying ? <WaveformIcon /> : <Play className="h-3 w-3" />}
    </Button>
  );
};
