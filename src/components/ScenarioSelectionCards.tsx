// ScenarioSelectionCards.tsx - Complete standalone component
import React from "react";
import { cn } from "../lib/utils";

// Inlined Card components
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-white text-gray-900 shadow-sm",
      className
    )}
    {...props}
  />
));

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
));

// Main component interface
interface ScenarioSelectionCardsProps {
  onSelectScenario: (scenario: 'pitch' | 'planning' | 'focus') => void;
}

// Main component
export const ScenarioSelectionCards = ({ onSelectScenario }: ScenarioSelectionCardsProps) => {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">Create a custom scenario</h3>
      </div>

      <div className="space-y-3">
        {/* 1. Pitch Card - ACTIVE */}
        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg group border-gray-200 shadow-sm hover:shadow-md"
          onClick={() => onSelectScenario('pitch')}
        >
          {/* Blue accent bar */}
          <div className="h-1.5 bg-primary rounded-t-lg" />

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 group-hover:text-primary transition-colors duration-300">
                  Pitch to a client
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Get feedback on your ideas, proposal, or presentation before the real thing
                </CardDescription>
              </div>

              {/* Visual participant indicators */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-gray-500">Participants</span>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
                    >
                      <span className="text-xs text-gray-400">+</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 2. Planning Card - DISABLED */}
        <Card className="relative opacity-60 cursor-not-allowed border-gray-200">
          {/* "Available Soon" badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Available Soon
            </div>
          </div>

          {/* Grayed accent bar */}
          <div className="h-1.5 bg-gray-300 rounded-t-lg" />

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg text-gray-600">
                  Plan work with your team
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Plan ahead and brainstorm solutions with colleagues and experts in your field
                </CardDescription>
              </div>

              {/* Grayed participant indicators */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-gray-500">Participants</span>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 bg-gray-100 flex items-center justify-center"
                    >
                      <span className="text-xs text-gray-300">+</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 3. Focus Group Card - DISABLED */}
        <Card className="relative opacity-60 cursor-not-allowed border-gray-200">
          {/* "Available Soon" badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Available Soon
            </div>
          </div>

          {/* Grayed accent bar */}
          <div className="h-1.5 bg-gray-300 rounded-t-lg" />

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg text-gray-600">
                  Run a focus group
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Gather feedback on a concept, product, or prototype with a guided panel
                </CardDescription>
              </div>

              {/* Grayed participant indicators */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-gray-500">Participants</span>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 bg-gray-100 flex items-center justify-center"
                    >
                      <span className="text-xs text-gray-300">+</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

