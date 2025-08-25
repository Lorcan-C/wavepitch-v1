import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from './progress';
import { Search, Sparkles } from 'lucide-react';

interface ResearchProgressProps {
  isVisible: boolean;
  isComplete?: boolean;
}

export const ResearchProgress = ({ 
  isVisible, 
  isComplete = false 
}: ResearchProgressProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-4 shadow-sm"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isComplete ? {} : { rotate: 360 }}
            transition={{ duration: 2, repeat: isComplete ? 0 : Infinity, ease: "linear" }}
          >
            {isComplete ? (
              <Sparkles className="h-4 w-4 text-primary" />
            ) : (
              <Search className="h-4 w-4 text-primary" />
            )}
          </motion.div>
          <h4 className="text-sm font-medium text-foreground">
            {isComplete ? 'Research Complete' : 'Researching Market Context'}
          </h4>
        </div>

        {!isComplete && (
          <div className="space-y-2">
            <Progress value={85} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              Gathering latest insights for your pitch...
            </p>
          </div>
        )}

        {isComplete && (
          <p className="text-xs text-muted-foreground">
            Latest market insights added to meeting context
          </p>
        )}
      </div>
    </motion.div>
  );
};