import React from 'react';

import { format } from 'date-fns';

import { Button } from '../ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ConversationCardProps {
  title: string;
  startTime: string | Date;
  durationMinutes: number;
  participantCount: number;
  onResume?: () => void;
  isPlaceholder?: boolean;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  title,
  startTime,
  durationMinutes,
  participantCount,
  onResume,
  isPlaceholder = false,
}) => {
  const formattedTime = isPlaceholder
    ? (startTime as string)
    : format(new Date(startTime), 'MMM d, yyyy h:mm a');

  return (
    <Card
      className={`transition-shadow ${
        isPlaceholder
          ? 'opacity-50 pointer-events-none bg-gray-50'
          : 'hover:shadow-md cursor-pointer'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">
              {formattedTime} • {durationMinutes} min • {participantCount} participants
            </CardDescription>
          </div>
          <Button onClick={onResume} disabled={isPlaceholder} size="sm" className="ml-4">
            Resume
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
