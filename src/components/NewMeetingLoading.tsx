import React from 'react';

import { Loader2 } from 'lucide-react';

interface NewMeetingLoadingProps {
  message?: string;
}

export const NewMeetingLoading: React.FC<NewMeetingLoadingProps> = ({
  message = 'Processing your scenario...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{message}</h3>
        <p className="text-gray-600">Setting up your personalized experience</p>
      </div>

      <div className="w-64 bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  );
};

export default NewMeetingLoading;
