import { useCallback } from 'react';

import { useTTSStore } from '@/stores/tts-store';

export function useTTSConsent() {
  const { audioRepliesEnabled, capabilities, setAudioRepliesEnabled, setCapabilities } =
    useTTSStore();

  const detectCapabilities = useCallback(async () => {
    const capabilities = {
      browserTTSAvailable: 'speechSynthesis' in window,
      audioContextAvailable: 'AudioContext' in window || 'webkitAudioContext' in window,
      speechSynthesisAvailable:
        'speechSynthesis' in window && speechSynthesis.getVoices().length > 0,
    };

    setCapabilities(capabilities);
    return capabilities;
  }, [setCapabilities]);

  const enableAudioReplies = useCallback(async () => {
    setAudioRepliesEnabled(true);
    await detectCapabilities();
  }, [setAudioRepliesEnabled, detectCapabilities]);

  const disableAudioReplies = useCallback(() => {
    setAudioRepliesEnabled(false);
  }, [setAudioRepliesEnabled]);

  return {
    audioRepliesEnabled,
    capabilities,
    enableAudioReplies,
    disableAudioReplies,
  };
}
