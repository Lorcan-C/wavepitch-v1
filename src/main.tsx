import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { PostHogProvider } from 'posthog-js/react'
import App from './App.tsx'
import './styles/index.css'
import { clerkPublishableKey } from './lib/clerk'

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <App />
      </ClerkProvider>
    </PostHogProvider>
  </StrictMode>,
)