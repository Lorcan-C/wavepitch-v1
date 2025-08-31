import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TTSCapabilities {
  browserTTSAvailable: boolean;
  audioContextAvailable: boolean;
  speechSynthesisAvailable: boolean;
}

interface TTSState {
  audioRepliesEnabled: boolean;
  capabilities: TTSCapabilities | null;
}

interface TTSActions {
  setAudioRepliesEnabled: (enabled: boolean) => void;
  setCapabilities: (capabilities: TTSCapabilities) => void;
}

const initialState: TTSState = {
  audioRepliesEnabled: false,
  capabilities: null,
};

export const useTTSStore = create<TTSState & TTSActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAudioRepliesEnabled: (enabled) => set({ audioRepliesEnabled: enabled }),
      setCapabilities: (capabilities) => set({ capabilities }),
    }),
    {
      name: 'tts-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        audioRepliesEnabled: state.audioRepliesEnabled,
      }),
    },
  ),
);
