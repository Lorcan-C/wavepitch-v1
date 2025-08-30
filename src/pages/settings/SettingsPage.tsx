import React from 'react';

import { UserProfile } from '@clerk/clerk-react';
import { Bell, Palette, Settings, User } from 'lucide-react';

import { Logo } from '../../components/Logo';

const SettingsPage: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col relative"
      style={{
        backgroundImage: 'url(/images/pitchflow_v2.webp)',
      }}
    >
      {/* Logo */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-20">
        <Logo size="md" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-6xl bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 mt-20 space-y-8">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and application preferences
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  <User className="w-5 h-5" />
                  <span className="font-medium">Account & Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Palette className="w-5 h-5" />
                  <span>Appearance</span>
                </button>
              </nav>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200">
                <UserProfile
                  appearance={{
                    elements: {
                      navbarMobileMenuButton: 'hidden',
                      navbar: 'hidden',
                      pageScrollBox: 'bg-transparent shadow-none border-none',
                      card: 'shadow-none border-none',
                      rootBox: 'shadow-none',
                    },
                  }}
                  routing="hash"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
