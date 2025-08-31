import React, { useState } from 'react';

import { Pause, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
    </Button>
  );
};
