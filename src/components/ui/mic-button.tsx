import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MicButtonProps {
  isRecording?: boolean;
  isVoiceActive?: boolean;
  audioLevel?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'floating' | 'ghost';
  onClick?: () => void;
  className?: string;
}

export const MicButton = React.forwardRef<HTMLButtonElement, MicButtonProps>(
  (
    {
      isRecording = false,
      isVoiceActive = false,
      audioLevel = 0,
      disabled = false,
      size = 'md',
      variant = 'default',
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    const iconSizes = {
      sm: 16,
      md: 20,
      lg: 24,
    };

    const variantClasses = {
      default: cn(
        'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        isRecording ? 'bg-red-50 border-red-200 text-red-600' : ''
      ),
      floating: cn(
        'shadow-lg bg-white border-gray-200',
        isRecording ? 'bg-red-50 border-red-200 text-red-600 shadow-red-200/50' : ''
      ),
      ghost: cn(
        'border-transparent hover:bg-accent hover:text-accent-foreground',
        isRecording ? 'text-red-600 bg-red-50' : ''
      ),
    };

    // Pulse animation intensity based on voice activity
    const pulseIntensity = isVoiceActive ? 1 + audioLevel * 0.3 : 1;
    
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          
          // Size
          sizeClasses[size],
          
          // Variant
          variantClasses[variant],
          
          // Recording state
          isRecording && 'animate-pulse',
          
          className
        )}
        style={{
          transform: isRecording ? `scale(${pulseIntensity})` : undefined,
        }}
        {...props}
      >
        {isRecording ? (
          <MicOff size={iconSizes[size]} />
        ) : (
          <Mic size={iconSizes[size]} />
        )}
      </button>
    );
  }
);

MicButton.displayName = 'MicButton';