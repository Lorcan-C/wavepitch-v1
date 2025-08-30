import React, { useState } from 'react';

import { useSimpleTTS } from '../hooks/useSimpleTTS';
import type { OpenAIVoice } from '../services/voice/types';

const VOICE_OPTIONS: { value: OpenAIVoice; label: string }[] = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'nova', label: 'Nova' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'shimmer', label: 'Shimmer' },
];

export function TTSDemo() {
  const [text, setText] = useState('hello! this is the MVP talking.');
  const [selectedVoice, setSelectedVoice] = useState<OpenAIVoice>('nova');

  const { speak, stop, isSpeaking, error } = useSimpleTTS({
    voice: selectedVoice,
    format: 'mp3',
    speed: 1.0,
  });

  const handleSpeak = () => {
    speak(text);
  };

  const handleStop = () => {
    stop();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">TTS Demo</h2>

        {/* Text Input */}
        <div className="space-y-2">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
            Text to speak
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
            maxLength={4000}
            placeholder="Enter text to convert to speech..."
          />
          <p className="text-xs text-gray-500">{text.length}/4000 characters</p>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700">
            Voice
          </label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value as OpenAIVoice)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {VOICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={handleSpeak}
            disabled={isSpeaking || !text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSpeaking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Speaking...
              </>
            ) : (
              'Speak'
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={!isSpeaking}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* iOS Note */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">iOS Safari Note</h3>
              <p className="text-sm text-blue-700 mt-1">
                On iOS devices, audio playback requires a user gesture. Tap the "Speak" button to
                enable audio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
