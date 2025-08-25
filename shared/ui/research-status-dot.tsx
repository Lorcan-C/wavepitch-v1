import React from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface ResearchStatusDotProps {
  isResearching: boolean;
  researchComplete: boolean;
  className?: string;
}

export const ResearchStatusDot = ({ 
  isResearching, 
  researchComplete, 
  className = "" 
}: ResearchStatusDotProps) => {
  if (!isResearching && !researchComplete) return null;

  const getStatus = () => {
    if (isResearching) return {
      color: 'bg-amber-500',
      tooltip: 'Market research in progress...',
      animate: true
    };
    if (researchComplete) return {
      color: 'bg-green-500',
      tooltip: 'Research complete - latest insights added',
      animate: false
    };
    return { color: '', tooltip: '', animate: false };
  };

  const status = getStatus();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`relative ${className}`}
          >
            <motion.div
              className={`w-2.5 h-2.5 rounded-full ${status.color} shadow-sm`}
              animate={status.animate ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              } : {}}
              transition={status.animate ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
            />
            {status.animate && (
              <motion.div
                className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${status.color} opacity-30`}
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.3, 0.1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {status.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};