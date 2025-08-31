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
    console.log('TTS: User enabled audio replies');
    setAudioRepliesEnabled(true);
    const caps = await detectCapabilities();
    console.log('TTS: Capabilities detected', caps);
  }, [setAudioRepliesEnabled, detectCapabilities]);

  const disableAudioReplies = useCallback(() => {
    console.log('TTS: User disabled audio replies');
    setAudioRepliesEnabled(false);
  }, [setAudioRepliesEnabled]);

  return {
    audioRepliesEnabled,
    capabilities,
    enableAudioReplies,
    disableAudioReplies,
  };
}
