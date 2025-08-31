import React, { useCallback, useEffect, useState } from 'react';

import { AlertCircle, RefreshCw, Users } from 'lucide-react';

import { TTSConsentToggle } from '@/components/tts/TTSConsentToggle';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Participant } from '@/meetings/types';
import { useMeetingStore } from '@/stores/meeting-store';

interface ExpertPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Safe expert card component with error boundary
const ExpertCard: React.FC<{ expert: Participant }> = ({ expert }) => {
  // Safety check - return null if expert data is invalid
  if (!expert || !expert.id) {
    return null;
  }

  // Helper function to safely get background color for avatar
  const getAvatarBackgroundColor = (color?: string) => {
    if (!color) return 'bg-gray-200';

    const colorMap: Record<string, string> = {
      purple: 'bg-purple-200',
      blue: 'bg-blue-200',
      pink: 'bg-pink-200',
      green: 'bg-green-200',
      yellow: 'bg-yellow-200',
      red: 'bg-red-200',
    };
    return colorMap[color] || 'bg-gray-200';
  };

  return (
    <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${getAvatarBackgroundColor(
            expert.color,
          )}`}
        >
          {expert.avatar || '👤'}
        </div>

        {/* Expert Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 leading-tight">
            {expert.name || 'Unknown Expert'}
          </div>
          <div className="text-sm text-gray-600 mb-1">{expert.role || 'Expert'}</div>
          {expert.description && (
            <div className="text-xs text-gray-500 leading-relaxed line-clamp-3">
              {expert.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState: React.FC<{ onRegenerate: () => void; isLoading: boolean }> = ({
  onRegenerate,
  isLoading,
}) => (
  <div className="text-center py-8 text-gray-500">
    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
    <p className="mb-2">No experts available</p>
    <Button
      variant="outline"
      size="sm"
      onClick={onRegenerate}
      disabled={isLoading}
      className="text-xs"
    >
      Generate Expert Team
    </Button>
  </div>
);

// Loading state component
const LoadingState: React.FC = () => (
  <div className="text-center py-8 text-gray-500">
    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
    <p>Loading experts...</p>
  </div>
);

// Error state component
const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
    <div className="flex items-start gap-2">
      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="text-xs">
          Try Again
        </Button>
      </div>
    </div>
  </div>
);

export const ExpertPreviewDialog: React.FC<ExpertPreviewDialogProps> = ({ open, onOpenChange }) => {
  // Store state with null checks
  const store = useMeetingStore();
  const participants = store?.participants || [];
  const isStoreLoading = store?.isLoading || false;
  const storeError = store?.error || null;
  const meetingTitle = store?.meetingTitle || 'Your Meeting';

  // Local loading state for regeneration
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isRegenerating) {
        setIsRegenerating(false);
      }
    };
  }, [isRegenerating]);

  // Safe regeneration handler with proper error handling
  const handleRegenerateAll = useCallback(async () => {
    if (!store?.regenerateParticipants) {
      console.error('Regenerate function not available');
      return;
    }

    setIsRegenerating(true);

    try {
      await store.regenerateParticipants();
    } catch (error) {
      console.error('Failed to regenerate experts:', error);
      // Error is handled by the store, no need to set local error state
    } finally {
      // Use timeout to prevent race condition on unmount
      setTimeout(() => {
        setIsRegenerating(false);
      }, 100);
    }
  }, [store]);

  const handleContinue = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleRetry = useCallback(() => {
    if (store?.setError) {
      store.setError(null);
    }
    handleRegenerateAll();
  }, [store, handleRegenerateAll]);

  // Determine what to show
  const isLoading = isStoreLoading || isRegenerating;
  const hasError = !!storeError;
  const hasParticipants = participants.length > 0;
  const validParticipants = participants.filter((p) => p && p.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Your Meeting Experts
          </DialogTitle>
          <DialogDescription>AI-generated experts for "{meetingTitle}"</DialogDescription>
        </DialogHeader>

        <TTSConsentToggle className="px-6 py-4 border-b border-gray-100" />

        <div className="max-h-[400px] overflow-y-auto">
          {/* Error State */}
          {hasError && <ErrorState error={storeError!} onRetry={handleRetry} />}

          {/* Loading State */}
          {isLoading && !hasError && <LoadingState />}

          {/* Empty State */}
          {!isLoading && !hasError && !hasParticipants && (
            <EmptyState onRegenerate={handleRegenerateAll} isLoading={isLoading} />
          )}

          {/* Participants List */}
          {!isLoading && !hasError && hasParticipants && (
            <div className="space-y-3">
              {validParticipants.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}

              {/* Show message if some participants were filtered out */}
              {validParticipants.length !== participants.length && (
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  Note: Some expert data was invalid and has been filtered out.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleRegenerateAll}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Experts'}
          </Button>

          <Button onClick={handleContinue} disabled={isLoading} className="min-w-[120px]">
            {hasParticipants ? 'Start Meeting' : 'Continue Anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
