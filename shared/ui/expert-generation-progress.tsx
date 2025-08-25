
import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from './progress';
import { Sparkles } from 'lucide-react';

interface ExpertGenerationProgressProps {
  isVisible: boolean;
  progress: number;
}

export const ExpertGenerationProgress = ({ 
  isVisible, 
  progress
}: ExpertGenerationProgressProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white border rounded-lg p-6 shadow-sm"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </motion.div>
          <h3 className="font-medium text-gray-900">Generating Your Expert Team</h3>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </motion.div>
  );
};
