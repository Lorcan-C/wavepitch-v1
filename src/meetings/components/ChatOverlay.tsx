import React from 'react';

import { X } from 'lucide-react';

interface ChatOverlayProps {
  onClose: () => void;
  children: React.ReactNode;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Chat content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};
