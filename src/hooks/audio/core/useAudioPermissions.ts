import { useCallback, useState } from 'react';
import { detectBrowserSupport } from '../utils/audioUtils';
import { ERROR_MESSAGES } from '../utils/audioConstants';

export interface AudioPermissionsState {
  hasPermission: boolean | null;
  isSupported: boolean;
  error: string | null;
  isRequesting: boolean;
}

export const useAudioPermissions = () => {
  const [state, setState] = useState<AudioPermissionsState>(() => {
    const { isSupported } = detectBrowserSupport();
    return {
      hasPermission: null,
      isSupported,
      error: null,
      isRequesting: false,
    };
  });

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: ERROR_MESSAGES.NOT_SUPPORTED }));
      return false;
    }

    setState(prev => ({ ...prev, isRequesting: true, error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clean up test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({ 
        ...prev, 
        hasPermission: true, 
        isRequesting: false,
        error: null 
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.name === 'NotAllowedError' 
          ? ERROR_MESSAGES.PERMISSION_DENIED
          : error.message
        : ERROR_MESSAGES.UNKNOWN_ERROR;

      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        isRequesting: false,
        error: errorMessage 
      }));
      
      return false;
    }
  }, [state.isSupported]);

  const resetPermission = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      hasPermission: null, 
      error: null 
    }));
  }, []);

  return {
    ...state,
    requestPermission,
    resetPermission,
  };
};