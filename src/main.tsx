import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { PostHogProvider } from 'posthog-js/react'
import App from './App.tsx'
import { clerkConfig } from './services/clerkConfig'
import './styles/index.css'

function RootApp() {
  const [clerkKey, setClerkKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    clerkConfig.getPublishableKey()
      .then(key => {
        setClerkKey(key)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load Clerk configuration:', err)
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (!clerkKey) {
    return <div className="flex items-center justify-center min-h-screen">Failed to load authentication configuration</div>
  }
  
  return (
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={{
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    }}>
      <ClerkProvider publishableKey={clerkKey}>
        <App />
      </ClerkProvider>
    </PostHogProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)