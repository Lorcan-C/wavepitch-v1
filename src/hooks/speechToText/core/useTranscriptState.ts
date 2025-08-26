import { useCallback, useState } from 'react';
import {
  TranscriptResult,
  TranscriptState,
  createInitialTranscriptState,
  updateTranscriptState,
  resetTranscriptState,
} from '../utils/transcriptUtils';

export interface TranscriptConfig {
  onTranscript?: (result: TranscriptResult) => void;
}

export const useTranscriptState = (config: TranscriptConfig = {}) => {
  const { onTranscript } = config;

  const [state, setState] = useState<TranscriptState>(createInitialTranscriptState);

  const updateTranscript = useCallback((result: TranscriptResult) => {
    setState(prev => updateTranscriptState(prev, result));
    onTranscript?.(result);
  }, [onTranscript]);

  const resetTranscript = useCallback(() => {
    setState(resetTranscriptState());
  }, []);

  return {
    transcript: state,
    updateTranscript,
    resetTranscript,
  };
};