
import React from "react";
import { Button } from "../../../../../shared/ui/button";
import { ArrowLeft } from "lucide-react";

interface WorkflowContainerProps {
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  actionButton?: React.ReactNode;
  bottomActionButton?: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export const WorkflowContainer = ({
  title,
  icon,
  onBack,
  actionButton,
  bottomActionButton,
  currentStep,
  totalSteps,
  children
}: WorkflowContainerProps) => {
  return (
    <div className="w-full bg-gray-50/50 p-4 rounded-lg border border-gray-100">
      <h2 className="text-xl font-bold mb-4 flex items-center justify-center text-[#0EA5E9]">
        {icon}
        {title}
      </h2>
      
      <div className="flex flex-col h-full">
        {/* Header with navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {actionButton}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i + 1}
                className={`h-1 flex-1 rounded ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Bottom Action Button */}
        {bottomActionButton && (
          <div className="mt-4 pt-4 border-t border-border flex justify-center">
            {bottomActionButton}
          </div>
        )}
      </div>
    </div>
  );
};
