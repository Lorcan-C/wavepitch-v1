import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { supabase } from '../lib/supabase';
import { ExpertApiData, MeetingSummary, Message, Participant } from '../meetings/types';
import { meetingSummaryService } from '../services/MeetingSummaryService';

interface MeetingState {
  meetingId: string;
  sessionId: string;
  meetingTitle: string;
  participants: Participant[];
  messages: Message[];
  currentSpeakerIndex: number;
  isLoading: boolean;
  error: string | null;
  // Add fields for tracking meeting lifecycle
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  isMeetingActive: boolean;
  // Summary state
  summary: MeetingSummary | null;
  isGeneratingSummary: boolean;
  summaryError: string | null;
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
  regenerateParticipants: () => Promise<void>;
  updateAllParticipants: (participants: Participant[]) => void;

  // New actions for meeting lifecycle
  startMeeting: () => void;
  endMeeting: () => Promise<void>;
  saveMeetingToSupabase: () => Promise<boolean>;
  resumeMeeting: (conversationId: string) => Promise<void>;
  // Summary actions
  generateSummary: () => Promise<void>;
  clearSummary: () => void;
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
  meetingStartTime: null,
  meetingEndTime: null,
  isMeetingActive: false,
  summary: null,
  isGeneratingSummary: false,
  summaryError: null,
};

export const useMeetingStore = create<MeetingState & MeetingActions>()(
  devtools(
    persist(
      immer((set, get) => ({
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
              state.currentSpeakerIndex =
                (state.currentSpeakerIndex + 1) % state.participants.length;
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

        regenerateParticipants: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await fetch('/api/messages/pre-meeting', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pitchDescription: get().meetingTitle,
                meetingType: 'pitch',
                generateExpertsOnly: true,
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.meetingData?.experts) {
              set((state) => {
                state.participants = result.meetingData.experts.map(
                  (expert: ExpertApiData, index: number) => ({
                    id: expert.id || `expert-${index}`,
                    name: expert.name || `Expert ${index + 1}`,
                    role: expert.role || 'Expert',
                    description: expert.bio || expert.description || '',
                    avatar: expert.avatar,
                    color: expert.color,
                  }),
                );
              });
            } else {
              throw new Error('Invalid response format');
            }
          } catch (error) {
            console.error('Failed to regenerate participants:', error);
            set((state) => {
              state.error = 'Failed to regenerate experts. Please try again.';
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        updateAllParticipants: (participants) =>
          set((state) => {
            state.participants = participants;
          }),

        // New meeting lifecycle methods
        startMeeting: () =>
          set((state) => {
            state.isMeetingActive = true;
            state.meetingStartTime = new Date().toISOString();
            state.meetingEndTime = null;
          }),

        endMeeting: async () => {
          set((state) => {
            state.isMeetingActive = false;
            state.meetingEndTime = new Date().toISOString();
          });

          // Auto-save to Supabase when meeting ends
          await get().saveMeetingToSupabase();
        },

        saveMeetingToSupabase: async (): Promise<boolean> => {
          const state = get();

          // Only save if we have a valid meeting
          if (!state.meetingId || !state.meetingTitle || state.messages.length === 0) {
            console.log('No valid meeting data to save');
            return false;
          }

          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
              console.log('No authenticated user, skipping Supabase save');
              return false;
            }

            // Calculate meeting duration
            const startTime = state.meetingStartTime || new Date().toISOString();
            const endTime = state.meetingEndTime || new Date().toISOString();
            const durationMinutes = Math.round(
              (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60),
            );

            // Prepare transcript data
            const transcriptData = {
              id: state.meetingId,
              title: state.meetingTitle,
              platform: 'wavepitch',
              meetingId: state.meetingId,
              startTime: startTime,
              endTime: endTime,
              durationMinutes: durationMinutes,
              participantCount: state.participants.length,
              participants: state.participants,
              messages: state.messages,
              segments: state.messages.map((msg, index) => ({
                id: msg.id,
                speaker: msg.senderName || msg.sender,
                text: msg.content,
                startTime: index * 30, // Approximate timing
                endTime: (index + 1) * 30,
                confidence: 1.0,
              })),
              fullText: state.messages.map((msg) => msg.content).join(' '),
              sessionId: state.sessionId,
            };

            // Save to Supabase
            const { error } = await supabase.from('conversations').upsert(
              {
                id: state.meetingId,
                title: state.meetingTitle,
                platform: 'wavepitch',
                meeting_id: state.meetingId,
                start_time: startTime,
                end_time: endTime,
                duration_minutes: durationMinutes,
                participant_count: state.participants.length,
                transcript_data: transcriptData,
                user_id: user.id,
              },
              {
                onConflict: 'id',
              },
            );

            if (error) {
              console.error('Failed to save meeting to Supabase:', error);
              set((state) => {
                state.error = 'Failed to save meeting to cloud storage';
              });
              return false;
            }

            console.log('Meeting saved to Supabase successfully');
            return true;
          } catch (error) {
            console.error('Error saving meeting to Supabase:', error);
            set((state) => {
              state.error = 'Failed to save meeting to cloud storage';
            });
            return false;
          }
        },

        resumeMeeting: async (conversationId: string) => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', conversationId)
              .eq('user_id', user.id)
              .single();

            if (error) throw error;

            const transcriptData = data.transcript_data;
            set((state) => {
              state.meetingId = data.id;
              state.sessionId = data.meeting_id;
              state.meetingTitle = data.title;
              state.participants = transcriptData.participants || [];
              state.messages = transcriptData.messages || [];
              state.currentSpeakerIndex = 0;
              state.isMeetingActive = true;
              state.meetingStartTime = new Date().toISOString();
              state.meetingEndTime = null;
              state.error = null;
            });
          } catch (error) {
            console.error('Failed to resume meeting:', error);
            set((state) => {
              state.error = 'Failed to resume meeting';
            });
          }
        },

        // Summary actions
        generateSummary: async () => {
          set((state) => {
            state.isGeneratingSummary = true;
            state.summaryError = null;
          });

          try {
            const summary = await meetingSummaryService.generateMeetingSummary(get().messages);
            set((state) => {
              state.summary = summary;
              state.isGeneratingSummary = false;
            });
          } catch (error) {
            console.error('Failed to generate summary:', error);
            set((state) => {
              state.summaryError =
                error instanceof Error ? error.message : 'Failed to generate summary';
              state.isGeneratingSummary = false;
            });
          }
        },

        clearSummary: () =>
          set((state) => {
            state.summary = null;
            state.summaryError = null;
            state.isGeneratingSummary = false;
          }),
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
          meetingStartTime: state.meetingStartTime,
          meetingEndTime: state.meetingEndTime,
          isMeetingActive: state.isMeetingActive,
          summary: state.summary,
          isGeneratingSummary: state.isGeneratingSummary,
        }),
      },
    ),
    {
      name: 'MeetingStore',
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
