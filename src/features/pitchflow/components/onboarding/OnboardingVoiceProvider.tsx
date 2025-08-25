
import React, { useState, useEffect } from "react";
// TODO: Import useSpeechRecognition hook from shared hooks or create stub
// import { useSpeechRecognition } from "../../../../../shared/hooks/useSpeechRecognition";

// Temporary stub for useSpeechRecognition
const useSpeechRecognition = () => ({
  isListening: false,
  transcript: '',
  isSpeechSupported: false,
  startVoiceRecognition: () => {},
  stopVoiceRecognition: () => {},
  setTranscript: () => {},
  currentLanguage: 'en-US'
});

interface OnboardingVoiceProviderProps {
  inputText: string;
  setInputText: (text: string) => void;
  isInputFocused: boolean;
  simulateButtonClick: (text: string) => void;
  children: React.ReactNode;
  onSendMessage?: (text: string) => void;
}

export const OnboardingVoiceProvider: React.FC<OnboardingVoiceProviderProps> = ({
  inputText,
  setInputText,
  isInputFocused,
  simulateButtonClick,
  children,
  onSendMessage
}) => {
  const { 
    isListening, 
    transcript, 
    isSpeechSupported,
    startVoiceRecognition,
    stopVoiceRecognition,
    setTranscript,
    currentLanguage
  } = useSpeechRecognition();
  
  console.log('OnboardingVoiceProvider: State:', {
    isListening,
    isSpeechSupported,
    transcript: transcript?.substring(0, 20) + '...',
    currentLanguage
  });
  
  // Update input text when transcript changes
  useEffect(() => {
    if (transcript) {
      console.log('OnboardingVoiceProvider: Setting transcript:', transcript);
      setInputText(transcript);
      
      // Auto-start conversation if we have text from voice recognition
      if (transcript.trim()) {
        // Use onSendMessage if provided, otherwise fall back to simulateButtonClick
        if (onSendMessage) {
          onSendMessage(transcript);
        } else {
          simulateButtonClick(transcript);
        }
      }
    }
  }, [transcript, setInputText, simulateButtonClick, onSendMessage]);
  
  // Toggle voice recognition - NO GLOBAL KEYBOARD LISTENER
  const toggleListening = () => {
    console.log('OnboardingVoiceProvider: Toggle listening, current state:', isListening);
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };
  
  // Clone the children and pass voice recognition props
  return React.cloneElement(children as React.ReactElement, {
    isListening,
    isSpeechSupported,
    startVoiceRecognition,
    stopVoiceRecognition,
    toggleListening,
    currentLanguage
  });
};
