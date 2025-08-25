
import React, { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface SpeechEnabledInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'input' | 'textarea';
  rows?: number;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SpeechEnabledInput = ({
  value,
  onChange,
  placeholder,
  variant = 'input',
  rows = 4,
  className = '',
  id,
  required = false,
  disabled = false
}: SpeechEnabledInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    isListening: speechIsListening,
    transcript,
    startVoiceRecognition,
    stopVoiceRecognition,
    setTranscript,
    isSpeechSupported
  } = useSpeechRecognition();

  // Sync listening state
  useEffect(() => {
    setIsListening(speechIsListening);
  }, [speechIsListening]);

  // Update input value when transcript changes
  useEffect(() => {
    if (transcript) {
      onChange(transcript);
    }
  }, [transcript, onChange]);

  const handleVoiceToggle = () => {
    if (!isSpeechSupported) {
      return;
    }

    if (isListening) {
      stopVoiceRecognition();
    } else {
      // Clear previous transcript and start fresh
      setTranscript('');
      startVoiceRecognition();
    }
  };

  const commonProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder,
    className: `${className} ${isListening ? 'border-primary border-2 bg-primary/5' : ''}`,
    id,
    required,
    disabled
  };

  return (
    <div className="relative">
      {variant === 'textarea' ? (
        <Textarea
          {...commonProps}
          rows={rows}
          ref={textareaRef}
        />
      ) : (
        <Input 
          {...commonProps} 
          ref={inputRef}
        />
      )}
      
      {isSpeechSupported && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleVoiceToggle}
          className={`absolute right-2 ${variant === 'textarea' ? 'top-2' : 'top-1/2 -translate-y-1/2'} h-8 w-8 ${
            isListening ? "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 animate-pulse" : ""
          }`}
          title={isListening ? "Stop listening" : "Start voice input"}
          disabled={disabled}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </Button>
      )}
    </div>
  );
};
