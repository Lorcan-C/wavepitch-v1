import { Message, Participant, User } from '../meetings/types';
import { AIResponseHandling } from './AIResponseHandling';
import { AIResponseService } from './AIResponseService';
import { MessageCommitService } from './MessageCommitService';
import { ResponseContextService } from './ResponseContextService';
import { SpeakerRotationService } from './SpeakerRotationService';
import { TTSTextProcessingService } from './TTSTextProcessingService';

interface GenerateMessageParams {
  participants: Participant[];
  currentSpeakerIndex: number;
  messages: Message[];
  sessionId: string;
  meetingId: string;
  meetingTitle: string;
  audioRepliesEnabled: boolean;
  user?: User;
  userMessage?: string;
  abortController?: AbortController;
  onSpeakerIndexChange: (newIndex: number) => void;
  onMessageAdd: (message: Message) => void;
  onSetMessages: (messages: Message[]) => void;
  onSetLoading: (loading: boolean) => void;
}

export class NextSpeakerService {
  static async generateNextMessage({
    participants,
    currentSpeakerIndex,
    messages,
    sessionId,
    meetingId,
    meetingTitle,
    audioRepliesEnabled,
    user,
    userMessage,
    onSpeakerIndexChange,
    onMessageAdd,
    onSetMessages,
    onSetLoading,
  }: GenerateMessageParams): Promise<void> {
    let currentMessages = messages;

    // If user message provided, commit it first
    if (userMessage && user) {
      const updatedMessages = MessageCommitService.commitMessage(userMessage, user, messages);
      onSetMessages(updatedMessages);
      currentMessages = updatedMessages;
    }

    // 1. Look up who should speak next
    const nextSpeaker = this.getNextSpeaker(participants, currentSpeakerIndex);

    onSetLoading(true);

    try {
      // 2. Generate their message
      const newMessage = await this.generateMessage(
        nextSpeaker,
        currentMessages,
        sessionId,
        meetingId,
        meetingTitle,
        user,
        userMessage,
      );

      // 3. Add it to conversation history
      onMessageAdd(newMessage);

      // 4. Generate TTS if enabled
      if (audioRepliesEnabled && !newMessage.isUser) {
        TTSTextProcessingService.processMessageForTTS(newMessage);
      }

      // 5. Move pointer forward so next turn is ready
      const nextIndex = SpeakerRotationService.advanceToNext(
        currentSpeakerIndex,
        participants.length,
      );
      onSpeakerIndexChange(nextIndex);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to generate AI response:', error);
        // Add error message to conversation
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: 'Sorry, the response service is currently experiencing some difficulties.',
          sender: nextSpeaker.id,
          isUser: false,
          timestamp: Date.now(),
          senderName: nextSpeaker.name,
        };
        onMessageAdd(errorMessage);
      }
    } finally {
      onSetLoading(false);
    }
  }

  private static getNextSpeaker(participants: Participant[], currentIndex: number): Participant {
    return SpeakerRotationService.getCurrentSpeaker(participants, currentIndex);
  }

  private static async generateMessage(
    speaker: Participant,
    messages: Message[],
    sessionId: string,
    meetingId: string,
    meetingTitle: string,
    user?: User,
    userMessage?: string,
  ): Promise<Message> {
    // Get agent context for the speaker
    const agentContext = ResponseContextService.getNextAgent([speaker], 0, meetingTitle);

    // Create user message object if provided
    const userMessageObj =
      userMessage && user ? MessageCommitService.createUserMessage(userMessage, user) : null;

    // Generate AI response
    const aiResult = await AIResponseService.generateResponse({
      sessionId: sessionId || meetingId,
      userMessage: userMessageObj || messages[messages.length - 1],
      agentContext,
    });

    // Process and return the response
    return await AIResponseHandling.processResponse(aiResult.response, speaker.id, speaker.name);
  }
}
