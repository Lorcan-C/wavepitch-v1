export interface TranscriptResult {
  type: 'partial' | 'final' | 'error' | 'connected' | 'end';
  text?: string;
  timestamp?: number;
  confidence?: number;
  is_final?: boolean;
  message?: string;
}

export interface TranscriptState {
  current: string; // Combined partial + final for display
  final: string; // Confirmed final text
  partial: string; // Current partial text
}

export const updateTranscriptState = (
  prevState: TranscriptState,
  result: TranscriptResult,
): TranscriptState => {
  switch (result.type) {
    case 'partial': {
      return {
        ...prevState,
        partial: result.text || '',
        current: prevState.final + (result.text || ''),
      };
    }

    case 'final': {
      const finalText = result.text || '';
      return {
        final: prevState.final + finalText,
        partial: '',
        current: prevState.final + finalText,
      };
    }

    default:
      return prevState;
  }
};

export const createInitialTranscriptState = (): TranscriptState => ({
  current: '',
  final: '',
  partial: '',
});

export const resetTranscriptState = (): TranscriptState => createInitialTranscriptState();
