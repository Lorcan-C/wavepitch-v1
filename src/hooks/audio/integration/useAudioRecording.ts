import { useCallback, useEffect } from 'react';
import { useAudioPermissions } from '../core/useAudioPermissions';
import { useAudioStream } from '../core/useAudioStream';
import { useAudioRecorder } from '../core/useAudioRecorder';
import { useAudioLevelMonitor } from '../enhancements/useAudioLevelMonitor';

export interface AudioRecordingConfig {
  sampleRate?: number;
  channelCount?: number;
  timeslice?: number;
  enableLevelMonitor?: boolean;
  onAudioData?: (data: ArrayBuffer) => void;
  onError?: (error: string) => void;
  onPermissionChange?: (hasPermission: boolean) => void;
}

export const useAudioRecording = (config: AudioRecordingConfig = {}) => {
  const {
    sampleRate,
    channelCount,
    timeslice,
    enableLevelMonitor = true,
    onAudioData,
    onError,
    onPermissionChange,
  } = config;

  // Core hooks
  const permissions = useAudioPermissions();
  const stream = useAudioStream({ sampleRate, channelCount });
  const recorder = useAudioRecorder(stream.stream, { 
    timeslice, 
    onDataAvailable: onAudioData,
    onError 
  });

  // Enhancement hooks
  const levelMonitor = useAudioLevelMonitor(
    enableLevelMonitor ? stream.stream : null
  );

  // Permission change callback
  useEffect(() => {
    if (permissions.hasPermission !== null) {
      onPermissionChange?.(permissions.hasPermission);
    }
  }, [permissions.hasPermission, onPermissionChange]);

  // Error handling
  const error = permissions.error || stream.error || recorder.error;
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Combined start recording
  const startRecording = useCallback(async () => {
    try {
      // Request permission first
      const hasPermission = await permissions.requestPermission();
      if (!hasPermission) return false;

      // Start audio stream
      const audioStream = await stream.startStream();
      if (!audioStream) return false;

      // Start level monitoring if enabled
      if (enableLevelMonitor) {
        levelMonitor.startMonitoring();
      }

      // Start recording
      await recorder.startRecording();
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      onError?.(errorMessage);
      return false;
    }
  }, [
    permissions.requestPermission,
    stream.startStream,
    recorder.startRecording,
    levelMonitor.startMonitoring,
    enableLevelMonitor,
    onError,
  ]);

  // Combined stop recording
  const stopRecording = useCallback(() => {
    recorder.stopRecording();
    levelMonitor.stopMonitoring();
    stream.stopStream();
  }, [recorder.stopRecording, levelMonitor.stopMonitoring, stream.stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      permissions.resetPermission();
    };
  }, [stopRecording, permissions.resetPermission]);

  return {
    // State
    isRecording: recorder.isRecording,
    isSupported: permissions.isSupported,
    hasPermission: permissions.hasPermission,
    isRequesting: permissions.isRequesting,
    streamActive: stream.isActive,
    error,

    // Audio level (if enabled)
    audioLevel: enableLevelMonitor ? levelMonitor.level : 0,
    isVoiceActive: enableLevelMonitor ? levelMonitor.isActive : false,

    // Actions
    startRecording,
    stopRecording,
    requestPermission: permissions.requestPermission,
  };
};