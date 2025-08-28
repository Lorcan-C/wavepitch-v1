import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  handler: () => void;
  description?: string;
}

/**
 * Hook for managing keyboard shortcuts
 * Automatically prevents shortcuts when user is typing in input fields
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => s.key === event.code);

      if (shortcut && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        shortcut.handler();
      }
    };

    // Add global event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};
