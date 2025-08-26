import { useCallback, useRef, useState } from 'react';
import { createAudioContext, normalizeAudioLevel } from '../utils/audioUtils';
import { AUDIO_CONFIG } from '../utils/audioConstants';

export interface AudioLevelState {
  level: number; // 0-1 normalized audio level
  isMonitoring: boolean;
  isActive: boolean; // Simple on/off for voice detection
}

export const useAudioLevelMonitor = (stream: MediaStream | null) => {
  const [state, setState] = useState<AudioLevelState>({
    level: 0,
    isMonitoring: false,
    isActive: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = useCallback(() => {
    if (!stream || state.isMonitoring) return;

    try {
      audioContextRef.current = createAudioContext(AUDIO_CONFIG.DEFAULT_SAMPLE_RATE);
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = AUDIO_CONFIG.FFT_SIZE;
      
      source.connect(analyserRef.current);
      setState(prev => ({ ...prev, isMonitoring: true }));

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current || !state.isMonitoring) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const level = normalizeAudioLevel(dataArray);
        const isActive = level > 0.1; // Simple threshold for voice detection
        
        setState(prev => ({ ...prev, level, isActive }));
      };

      intervalRef.current = setInterval(updateLevel, AUDIO_CONFIG.AUDIO_LEVEL_UPDATE_INTERVAL);
    } catch (error) {
      console.error('Failed to start audio level monitoring:', error);
    }
  }, [stream, state.isMonitoring]);

  const stopMonitoring = useCallback(() => {
    setState({ level: 0, isMonitoring: false, isActive: false });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  }, []);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    cleanup: stopMonitoring,
  };
};