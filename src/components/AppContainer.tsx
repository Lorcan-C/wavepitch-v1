import React from 'react';

import { cn } from '../lib/utils';

interface AppContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children, className = '' }) => {
  return (
    <div className="flex justify-center min-h-screen overflow-auto">
      <div
        className={cn('w-full max-w-[90rem] flex flex-col min-h-screen overflow-auto', className)}
      >
        {children}
      </div>
    </div>
  );
};
