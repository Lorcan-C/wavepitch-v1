import React, { useEffect, useState } from 'react';

interface MeetingTimerProps {
  startTime: string | null;
  className?: string;
}

export const MeetingTimer: React.FC<MeetingTimerProps> = ({ startTime, className = '' }) => {
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    if (!startTime) {
      setDuration('00:00');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const elapsed = Math.floor((now - start) / 1000);

      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;

      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return <div className={`font-mono text-sm text-gray-600 ${className}`}>{duration}</div>;
};
