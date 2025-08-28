import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { Message, Participant } from '../meetings/types';

interface MeetingState {
  meetingId: string;
  sessionId: string;
  meetingTitle: string;
  participants: Participant[];
  messages: Message[];
  currentSpeakerIndex: number;
  isLoading: boolean;
  error: string | null;
}

interface MeetingActions {
  loadMeeting: (data: {
    meetingId: string;
    sessionId: string;
    meetingTitle: string;
    participants: Participant[];
    messages: Message[];
  }) => void;
  addMessage: (message: Message) => void;
  nextSpeaker: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: MeetingState = {
  meetingId: '',
  sessionId: '',
  meetingTitle: '',
  participants: [],
  messages: [],
  currentSpeakerIndex: 0,
  isLoading: false,
  error: null,
};

export const useMeetingStore = create<MeetingState & MeetingActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      loadMeeting: (data) =>
        set((state) => {
          state.meetingId = data.meetingId;
          state.sessionId = data.sessionId;
          state.meetingTitle = data.meetingTitle;
          state.participants = data.participants;
          state.messages = data.messages;
          state.currentSpeakerIndex = 0;
          state.error = null;
        }),

      addMessage: (message) =>
        set((state) => {
          state.messages.push(message);
        }),

      nextSpeaker: () =>
        set((state) => {
          if (state.participants.length > 0) {
            state.currentSpeakerIndex = (state.currentSpeakerIndex + 1) % state.participants.length;
          }
        }),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      reset: () => set(() => initialState),
    })),
    {
      name: 'meeting-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        meetingId: state.meetingId,
        sessionId: state.sessionId,
        meetingTitle: state.meetingTitle,
        participants: state.participants,
        messages: state.messages,
        currentSpeakerIndex: state.currentSpeakerIndex,
      }),
    },
  ),
);

// Selectors (recommended Zustand pattern)
export const selectCurrentSpeaker = (state: MeetingState) =>
  state.participants[state.currentSpeakerIndex] || null;

export const selectNextSpeaker = (state: MeetingState) => {
  const nextIndex = (state.currentSpeakerIndex + 1) % Math.max(1, state.participants.length);
  return state.participants[nextIndex] || null;
};
