import React from 'react';

import { Shuffle, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { SpeakerQueueItem } from '../types';

interface SpeakerQueueProps {
  speakers: SpeakerQueueItem[];
  currentSpeakerIndex: number;
  onReshuffle: () => void;
  isVisible: boolean;
}

export const SpeakerQueue: React.FC<SpeakerQueueProps> = ({
  speakers,
  currentSpeakerIndex,
  onReshuffle,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Speaking Order</h3>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Reshuffle queue clicked');
            onReshuffle();
          }}
          className="w-full flex items-center gap-2"
        >
          <Shuffle className="h-4 w-4" />
          Reshuffle
        </Button>
      </div>

      {/* Speaker List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {speakers.map((speaker, index) => {
          const isCurrent = index === currentSpeakerIndex;
          const isNext = index === currentSpeakerIndex + 1;

          return (
            <div
              key={speaker.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                cursor-pointer hover:shadow-sm
                ${
                  isCurrent
                    ? 'bg-green-500/20 border border-green-500/30'
                    : isNext
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }
              `}
              onClick={() => console.log('Speaker queue item clicked:', speaker.name)}
            >
              {/* Position Number */}
              <div
                className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${
                  isCurrent
                    ? 'bg-green-500 text-white'
                    : isNext
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                }
              `}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                {speaker.avatar}
              </div>

              {/* Name */}
              <div className="flex-1">
                <p
                  className={`
                  text-sm font-medium
                  ${isCurrent ? 'text-green-800' : isNext ? 'text-yellow-800' : 'text-gray-900'}
                `}
                >
                  {speaker.name}
                </p>
                {isCurrent && <p className="text-xs text-green-600">Currently speaking</p>}
                {isNext && <p className="text-xs text-yellow-600">Up next</p>}
              </div>

              {/* Speaking Indicator */}
              {isCurrent && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
