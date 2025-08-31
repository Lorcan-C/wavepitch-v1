import React from 'react';

import * as Switch from '@radix-ui/react-switch';

import { useTTSConsent } from '@/hooks/tts/useTTSConsent';

interface TTSConsentToggleProps {
  className?: string;
}

export const TTSConsentToggle: React.FC<TTSConsentToggleProps> = ({ className }) => {
  const { audioRepliesEnabled, enableAudioReplies, disableAudioReplies } = useTTSConsent();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await enableAudioReplies();
    } else {
      disableAudioReplies();
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex flex-col">
        <label htmlFor="audio-replies-toggle" className="text-sm font-medium text-gray-900">
          Enable voice replies from participants
        </label>
        <span className="text-xs text-gray-500">Hear AI participants speak their responses</span>
      </div>
      <Switch.Root
        id="audio-replies-toggle"
        checked={audioRepliesEnabled}
        onCheckedChange={handleToggle}
        className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-blue-600 outline-none cursor-pointer"
      >
        <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </div>
  );
};
