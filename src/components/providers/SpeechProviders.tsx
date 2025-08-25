import React, { useEffect, useState } from 'react';

import { PCMAudioRecorderProvider } from '@speechmatics/browser-audio-input-react';
import { RealtimeTranscriptionProvider } from '@speechmatics/real-time-client-react';

interface SpeechProvidersProps {
  children: React.ReactNode;
}

export const SpeechProviders: React.FC<SpeechProvidersProps> = ({ children }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | undefined>();

  useEffect(() => {
    const ctx = new AudioContext();
    setAudioContext(ctx);

    return () => {
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    };
  }, []);

  return (
    <RealtimeTranscriptionProvider appId="wavepitch-v1">
      <PCMAudioRecorderProvider
        workletScriptURL="/js/pcm-audio-worklet.min.js"
        audioContext={audioContext}
      >
        {children}
      </PCMAudioRecorderProvider>
    </RealtimeTranscriptionProvider>
  );
};
