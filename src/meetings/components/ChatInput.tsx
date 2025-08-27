import React, { useState } from 'react';

import { ChevronRight, Mic, MicOff, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onNextSpeaker: () => void;
  onToggleMic: () => void;
  isMicActive: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onNextSpeaker,
  onToggleMic,
  isMicActive,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Sending message:', message);
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Text Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                resize-none transition-all duration-200
                max-h-32 min-h-[2.5rem]
              "
              rows={1}
              style={{
                height: 'auto',
                minHeight: '2.5rem',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim()}
            className="px-3"
            onClick={() => console.log('Send button clicked')}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {/* Microphone Toggle */}
          <Button
            type="button"
            variant={isMicActive ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => {
              console.log('Mic toggle clicked');
              onToggleMic();
            }}
            className="flex items-center gap-2"
          >
            {isMicActive ? (
              <>
                <MicOff className="h-4 w-4" />
                <span className="hidden sm:inline">Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Speak</span>
              </>
            )}
          </Button>

          {/* Next Speaker Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Next speaker clicked');
              onNextSpeaker();
            }}
            className="flex items-center gap-2 flex-1 justify-center"
          >
            <ChevronRight className="h-4 w-4" />
            Next Speaker
          </Button>
        </div>
      </form>
    </div>
  );
};
