import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import { FEATURE_FLAGS } from '../config/featureFlags';
import { scenarios } from '../config/scenarios';
import { useSpeechToText } from '../hooks/useSpeechToText';
import FileDropzone from './FileDropzone';
import { Logo } from './Logo';
import { NewMeetingLoading } from './NewMeetingLoading';
import { ResponsiveContainer } from './ResponsiveContainer';
import { MeetingProtect } from './billing/MeetingProtect';
import { MicButton } from './ui/mic-button';

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
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Speech-to-text integration
  const {
    isRecording,
    currentTranscript,
    startRecording,
    stopRecording,
    resetTranscript,
    isVoiceActive,
    audioLevel,
    error: speechError,
  } = useSpeechToText({
    language: 'en',
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        // Add final transcript to input with proper spacing
        setInputValue((prev) => {
          const newText = prev.trim() + (prev.trim() ? ' ' : '') + text.trim();
          return newText;
        });
      }
    },
    onError: (error) => {
      console.error('Speech-to-text error:', error);
      setError(`Voice input error: ${error}`);
    },
  });

  // Handle mic button click
  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      setError(null); // Clear any previous errors
      resetTranscript(); // Reset transcript for new recording
      await startRecording();
    }
  };

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
    setError(null);

    try {
      const scenarioData = {
        type: scenarioType,
        description: inputValue,
        files: uploadedFiles,
        timestamp: new Date().toISOString(),
      };

      console.log('Processing scenario data:', scenarioData);

      // Call new pre-meeting API
      const response = await fetch('/api/messages/pre-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pitchDescription: inputValue,
          meetingType: scenarioType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup meeting');
      }

      const result = await response.json();
      console.log('Generated meeting setup:', result);

      if (result.success) {
        // Store session data for later use
        sessionStorage.setItem(
          'meetingSession',
          JSON.stringify({
            sessionId: result.sessionId,
            meetingData: result.meetingData,
          }),
        );

        console.log('Meeting setup complete - navigating to meeting');
        navigate(`/app/meeting/${result.sessionId}`);
      } else {
        throw new Error(result.error || 'Meeting setup failed');
      }
    } catch (error: unknown) {
      console.error('Error setting up meeting:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to setup meeting. Please try again.';
      setError(errorMessage);
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
              {/* Textarea with Mic Button */}
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={getPlaceholder()}
                  rows={4}
                  className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* Mic Button */}
                <div className="absolute top-2 right-2">
                  <MicButton
                    isRecording={isRecording}
                    isVoiceActive={isVoiceActive}
                    audioLevel={audioLevel}
                    onClick={handleMicClick}
                    size="sm"
                    variant="ghost"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Real-time Transcription Preview */}
              {FEATURE_FLAGS.SHOW_LISTENING_BOX && isRecording && currentTranscript && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-blue-700">
                      {isVoiceActive ? 'Listening...' : 'Speak now'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 italic">"{currentTranscript}"</p>
                </div>
              )}

              <FileDropzone onFilesChange={setUploadedFiles} className="mt-4" />
            </div>

            {/* Error Display */}
            {(error || speechError) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error || speechError}</p>
              </div>
            )}

            {/* Continue Button */}
            <div className="flex justify-end mt-6">
              <MeetingProtect>
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
              </MeetingProtect>
            </div>
          </>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ScenarioInput;
