import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { ClerkProvider } from '@clerk/clerk-react';
import { RealtimeTranscriptionProvider } from '@speechmatics/real-time-client-react';
import { PostHogProvider } from 'posthog-js/react';

import App from './App.tsx';
import './styles/index.css';

// Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      }}
    >
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        signInFallbackRedirectUrl="/app/new"
        signUpFallbackRedirectUrl="/app/new"
        afterSignOutUrl="/"
      >
        <RealtimeTranscriptionProvider url="wss://eu2.rt.speechmatics.com/v2/" appId="wavepitch-v1">
          <App />
        </RealtimeTranscriptionProvider>
      </ClerkProvider>
    </PostHogProvider>
  </StrictMode>,
);
