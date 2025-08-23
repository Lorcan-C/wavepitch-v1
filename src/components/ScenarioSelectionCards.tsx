// ScenarioSelectionCards.tsx - Complete standalone component
import React from "react";
import { cn } from "../lib/utils";
import { scenarios } from "../config/scenarios";

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
        {scenarios.map((scenario) => (
          <Card 
            key={scenario.id}
            className={cn(
              "relative transition-all duration-200 border-gray-200",
              scenario.isActive 
                ? "cursor-pointer hover:shadow-lg group shadow-sm hover:shadow-md" 
                : "opacity-60 cursor-not-allowed"
            )}
            onClick={scenario.isActive ? () => onSelectScenario(scenario.id) : undefined}
          >
            {/* "Available Soon" badge for disabled scenarios */}
            {!scenario.isActive && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                  Available Soon
                </div>
              </div>
            )}

            {/* Accent bar */}
            <div className={cn("h-1.5 rounded-t-lg", scenario.accentColor)} />

            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className={cn(
                    "text-lg transition-colors duration-300",
                    scenario.isActive 
                      ? "text-gray-900 group-hover:text-primary" 
                      : "text-gray-600"
                  )}>
                    {scenario.title}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {scenario.description}
                  </CardDescription>
                </div>

                {/* Visual participant indicators */}
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-500">Participants</span>
                  <div className="flex -space-x-2">
                    {Array.from({ length: scenario.participantCount }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center",
                          scenario.isActive 
                            ? "border-gray-300 bg-gray-50" 
                            : "border-gray-200 bg-gray-100"
                        )}
                      >
                        <span className={cn(
                          "text-xs",
                          scenario.isActive ? "text-gray-400" : "text-gray-300"
                        )}>+</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

