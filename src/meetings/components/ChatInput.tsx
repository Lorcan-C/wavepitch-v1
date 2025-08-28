import React, { useState } from 'react';

import { ChevronRight, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MicButton } from '@/components/ui/mic-button';
import { Textarea } from '@/components/ui/textarea';

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
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="resize-none"
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
          <div className="flex items-center gap-2">
            <MicButton
              isRecording={isMicActive}
              size="md"
              variant="default"
              onClick={() => {
                console.log('Mic toggle clicked');
                onToggleMic();
              }}
            />
            <span className="text-sm text-gray-600 hidden sm:inline">
              {isMicActive ? 'Stop' : 'Speak'}
            </span>
          </div>

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
