import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { ClerkProvider } from '@clerk/clerk-react';
import { PCMAudioRecorderProvider } from '@speechmatics/browser-audio-input-react';
import { RealtimeTranscriptionProvider } from '@speechmatics/real-time-client-react';
import { PostHogProvider } from 'posthog-js/react';

import App from './App.tsx';
import './styles/index.css';

// Create audio context for Speechmatics browser audio input
const audioContext = typeof window !== 'undefined' ? new AudioContext() : undefined;

// Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: '2025-05-24',
      }}
    >
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        signInFallbackRedirectUrl="/app/new"
        signUpFallbackRedirectUrl="/app/new"
        afterSignOutUrl="/"
      >
        <RealtimeTranscriptionProvider url="wss://eu2.rt.speechmatics.com/v2/" appId="wavepitch-v1">
          <PCMAudioRecorderProvider
            workletScriptURL="/js/pcm-audio-worklet.min.js"
            audioContext={audioContext}
          >
            <App />
          </PCMAudioRecorderProvider>
        </RealtimeTranscriptionProvider>
      </ClerkProvider>
    </PostHogProvider>
  </StrictMode>,
);
