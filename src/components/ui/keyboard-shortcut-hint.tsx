import { useState } from 'react';

import { Keyboard, X } from 'lucide-react';

import { Button } from './button';

interface KeyboardShortcutHintProps {
  hasMessages: boolean;
  className?: string;
}

export function KeyboardShortcutHint({ hasMessages, className }: KeyboardShortcutHintProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('keyboardHintDismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('keyboardHintDismissed', 'true');
  };

  // Don't show if dismissed or no messages
  if (isDismissed || !hasMessages) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <Keyboard className="h-4 w-4" />
          <span>
            Press{' '}
            <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
              L
            </kbd>{' '}
            to skip to next speaker • Press{' '}
            <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono ml-1">
              Space
            </kbd>{' '}
            to toggle mic
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
