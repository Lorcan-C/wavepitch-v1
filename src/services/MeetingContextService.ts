interface MeetingContext {
  experts: Array<{
    id: string;
    name: string;
    role: string;
    expertise: string;
  }>;
  meetingContext: string;
  currentPhase?: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  context?: MeetingContext;
  expert?: MeetingContext['experts'][0];
}

export class MeetingContextService {
  private static contextStore = new Map<string, MeetingContext>();

  static updateContext(sessionId: string, updates: Partial<MeetingContext>): void {
    if (this.contextStore.has(sessionId)) {
      const existingContext = this.contextStore.get(sessionId)!;
      this.contextStore.set(sessionId, {
        ...existingContext,
        ...updates,
      });
    } else {
      this.contextStore.set(sessionId, updates as MeetingContext);
    }
  }

  static getContext(sessionId: string): MeetingContext | null {
    return this.contextStore.get(sessionId) || null;
  }

  static validateContextAndExpert(sessionId: string, expertId: string): ValidationResult {
    const context = this.getContext(sessionId);

    if (!context) {
      return {
        isValid: false,
        error: 'Meeting context not found',
      };
    }

    const expert = context.experts.find((e) => e.id === expertId);
    if (!expert) {
      return {
        isValid: false,
        error: 'Expert not found',
        context,
      };
    }

    return {
      isValid: true,
      context,
      expert,
    };
  }

  static formatContextForAI(
    context: MeetingContext,
    expert: MeetingContext['experts'][0],
    conversationHistory: Array<{
      sender: string;
      message: string;
      timestamp: number;
      isUser: boolean;
    }>,
    currentPhase: string,
    userMessage: string,
  ): string {
    return JSON.stringify({
      meeting: {
        context: context.meetingContext,
        phase: currentPhase,
        experts: context.experts,
      },
      conversation: {
        history: conversationHistory,
        currentMessage: userMessage,
      },
      expert: {
        name: expert.name,
        role: expert.role,
        expertise: expert.expertise,
      },
    });
  }
}
