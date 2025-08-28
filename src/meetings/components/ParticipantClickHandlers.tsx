import { useCallback, useRef } from 'react';

interface UseParticipantClickHandlersProps {
  isUser: boolean;
  participantId: string;
  onClick?: () => void;
  onPersonaClick?: (participantId: string) => void;
  onPersonaDoubleClick?: (participantId: string) => void;
}

export const useParticipantClickHandlers = ({
  isUser,
  participantId,
  onClick,
  onPersonaClick,
  onPersonaDoubleClick,
}: UseParticipantClickHandlersProps) => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  const handleClick = useCallback(() => {
    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
      // Set timeout for single click
      clickTimeoutRef.current = setTimeout(() => {
        // Single click - move to next in queue (existing behavior)
        if (!isUser && onPersonaClick) {
          onPersonaClick(participantId);
        } else if (isUser && onClick) {
          onClick();
        }
        clickCountRef.current = 0;
      }, 300); // 300ms delay to detect double click
    } else if (clickCountRef.current === 2) {
      // Double click - interrupt current speaker
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      if (!isUser && onPersonaDoubleClick) {
        onPersonaDoubleClick(participantId);
      } else if (isUser && onClick) {
        // For user double-click, trigger the same action as single click for now
        onClick();
      }

      clickCountRef.current = 0;
    }
  }, [isUser, onPersonaClick, onPersonaDoubleClick, onClick, participantId]);

  return {
    handleClick,
    isPersonaClickable: !isUser && (onPersonaClick || onPersonaDoubleClick),
    isUserClickable: isUser && onClick,
  };
};
