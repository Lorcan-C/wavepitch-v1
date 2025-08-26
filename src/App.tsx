import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';

import { LandingPage } from './components/LandingPage';
import { RequireApproval } from './components/RequireApproval';
import HubPage from './pages/hub/HubPage';
import MeetingsPage from './pages/meetings/MeetingsPage';
import NewPage from './pages/new/NewPage';
import SettingsPage from './pages/settings/SettingsPage';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected app routes */}
        <Route
          path="/app/*"
          element={
            <>
              <SignedIn>
                <RequireApproval>
                  <Routes>
                    <Route index element={<NewPage />} />
                    <Route path="new" element={<NewPage />} />
                    <Route path="meetings" element={<MeetingsPage />} />
                    <Route path="hub" element={<HubPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Routes>
                </RequireApproval>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Legacy routes - redirect to app */}
        <Route path="/demo" element={<Navigate to="/app" replace />} />
        <Route path="/new" element={<Navigate to="/app/new" replace />} />
        <Route path="/panel" element={<Navigate to="/app/meetings" replace />} />
        <Route path="/meetings" element={<Navigate to="/app/meetings" replace />} />
        <Route path="/hub" element={<Navigate to="/app/hub" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
