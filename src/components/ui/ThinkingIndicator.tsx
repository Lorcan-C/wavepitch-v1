import React, { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  isLoading: boolean;
  isStreaming: boolean;
  messageCount: number;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isLoading,
  isStreaming,
  messageCount,
}) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(messageCount);

  useEffect(() => {
    if (isLoading && !isStreaming) {
      setShouldShow(true);
    } else if (!isLoading) {
      setShouldShow(false);
    }
  }, [isLoading, isStreaming]);

  // Hide immediately when new message appears
  useEffect(() => {
    if (messageCount > lastMessageCount) {
      setShouldShow(false);
      setLastMessageCount(messageCount);
    }
  }, [messageCount, lastMessageCount]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
        <span className="text-sm text-gray-600">Thinking...</span>
      </div>
    </div>
  );
};
