import React, { useEffect, useState } from 'react';

import { ArrowLeft, Mic } from 'lucide-react';

import { scenarios } from '../config/scenarios';
import { useSpeechToText } from '../hooks/useSpeechToText';
import FileDropzone from './FileDropzone';
import { Logo } from './Logo';
import { NewMeetingLoading } from './NewMeetingLoading';
import { ResponsiveContainer } from './ResponsiveContainer';

// Simple SpeechEnabledInput component (inline for now)
interface SpeechEnabledInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'input' | 'textarea';
  rows?: number;
  className?: string;
}

const SpeechEnabledInput: React.FC<SpeechEnabledInputProps> = ({
  value,
  onChange,
  placeholder = 'Type here...',
  variant = 'textarea',
  rows = 4,
  className = '',
}) => {
  const { isListening, isConnecting, displayText, error, toggleListening } = useSpeechToText();

  // Update parent component when speech text changes
  useEffect(() => {
    if (displayText) {
      // Merge existing typed text with speech text
      const currentTypedText = value.replace(displayText, ''); // Remove any existing speech text
      const newValue = currentTypedText + displayText;
      onChange(newValue);
    }
  }, [displayText, onChange]);

  const InputComponent = variant === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={`relative ${className}`}>
      <InputComponent
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={variant === 'textarea' ? rows : undefined}
        className={`
          w-full px-3 py-2 pr-12 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${isListening || isConnecting ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
        `}
      />
      <button
        type="button"
        onClick={toggleListening}
        disabled={isConnecting}
        className={`
          absolute right-2 top-2 p-2 rounded-full transition-colors
          ${
            isListening
              ? 'bg-red-100 text-red-600'
              : isConnecting
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${isConnecting ? 'cursor-not-allowed opacity-50' : ''}
        `}
        title={
          isConnecting
            ? 'Connecting...'
            : isListening
              ? 'Click to stop recording'
              : 'Click to start recording'
        }
      >
        <Mic className="h-4 w-4" />
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border">
          {error}
        </div>
      )}
    </div>
  );
};

// Types
type ScenarioType = 'pitch' | 'planning' | 'focus';

interface ScenarioInputProps {
  scenarioType: ScenarioType;
  onBack: () => void;
}

export const ScenarioInput: React.FC<ScenarioInputProps> = ({ scenarioType, onBack }) => {
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if the scenario is active - if not, redirect back
  const scenario = scenarios.find((s) => s.id === scenarioType);
  if (!scenario?.isActive) {
    // Automatically redirect back for inactive scenarios
    setTimeout(() => onBack(), 0);
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">This scenario is not available yet.</p>
          <p className="text-sm text-gray-500">Redirecting back...</p>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    return scenario?.title || 'Custom scenario';
  };

  const getPlaceholder = () => {
    switch (scenarioType) {
      case 'pitch':
        return "Describe what you're pitching - your product, service, or idea...";
      case 'focus':
        return 'Describe the concept or product you want to test with a focus group...';
      default:
        return 'Describe what you want to plan or brainstorm...';
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);

    try {
      // TODO: Replace with actual backend API call
      const scenarioData = {
        type: scenarioType,
        description: inputValue,
        files: uploadedFiles,
        timestamp: new Date().toISOString(),
      };

      console.log('Processing scenario data:', scenarioData);

      // Mock backend processing delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // TODO: Navigate to next page when backend integration is complete
      console.log('Scenario processing complete');
    } catch (error) {
      console.error('Error processing scenario:', error);
      // TODO: Add proper error handling
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/images/pitchflow_v2.webp)',
      }}
    >
      {/* Logo */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-20">
        <Logo size="md" />
      </div>
      <ResponsiveContainer
        size="lg"
        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8"
      >
        {isLoading ? (
          <NewMeetingLoading message="Processing your scenario..." />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-semibold text-gray-900">{getTitle()}</h1>
            </div>

            {/* Input Container */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-dashed border-blue-500">
              <SpeechEnabledInput
                value={inputValue}
                onChange={setInputValue}
                placeholder={getPlaceholder()}
                variant="textarea"
                rows={4}
              />

              <FileDropzone onFilesChange={setUploadedFiles} className="mt-4" />
            </div>

            {/* Continue Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleContinue}
                disabled={!inputValue.trim() && uploadedFiles.length === 0}
                className={`
                    px-6 py-2 rounded-lg font-medium transition-colors
                    ${
                      inputValue.trim() || uploadedFiles.length > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ScenarioInput;
