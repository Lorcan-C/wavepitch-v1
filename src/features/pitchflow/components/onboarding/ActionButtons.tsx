import React from "react";
import { Target, Lightbulb } from "lucide-react";

interface ActionButtonsProps {
  onSelectScenario: (scenario: 'pitch' | 'planning') => void;
  selectedScenario: 'pitch' | 'planning' | null;
}

export const ActionButtons = ({ onSelectScenario, selectedScenario }: ActionButtonsProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pitch Button */}
        <button
          onClick={() => onSelectScenario('pitch')}
          className={`
            group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300
            hover:scale-105 hover:shadow-xl hover:border-primary/50
            ${selectedScenario === 'pitch' 
              ? 'border-primary bg-primary/5 shadow-lg' 
              : 'border-gray-200 bg-white hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className={`
              p-3 rounded-xl transition-colors duration-300
              ${selectedScenario === 'pitch' 
                ? 'bg-primary/10' 
                : 'bg-gray-100 group-hover:bg-primary/10'
              }
            `}>
              <Target className={`
                h-8 w-8 transition-colors duration-300
                ${selectedScenario === 'pitch' 
                  ? 'text-primary' 
                  : 'text-gray-700 group-hover:text-primary'
                }
              `} />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className={`
                text-xl font-semibold mb-2 transition-colors duration-300
                ${selectedScenario === 'pitch' 
                  ? 'text-primary' 
                  : 'text-gray-900 group-hover:text-primary'
                }
              `}>
                Pitch to a Client
              </h3>
              <p className="text-sm text-muted-foreground">
                Get feedback on your presentation before the real meeting
              </p>
            </div>
          </div>
          
          {/* Selection indicator */}
          {selectedScenario === 'pitch' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-2xl" />
          )}
        </button>

        {/* Planning Button */}
        <button
          onClick={() => onSelectScenario('planning')}
          className={`
            group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300
            hover:scale-105 hover:shadow-xl hover:border-primary/50
            ${selectedScenario === 'planning' 
              ? 'border-primary bg-primary/5 shadow-lg' 
              : 'border-gray-200 bg-white hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className={`
              p-3 rounded-xl transition-colors duration-300
              ${selectedScenario === 'planning' 
                ? 'bg-primary/10' 
                : 'bg-gray-100 group-hover:bg-primary/10'
              }
            `}>
              <Lightbulb className={`
                h-8 w-8 transition-colors duration-300
                ${selectedScenario === 'planning' 
                  ? 'text-primary' 
                  : 'text-gray-700 group-hover:text-primary'
                }
              `} />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className={`
                text-xl font-semibold mb-2 transition-colors duration-300
                ${selectedScenario === 'planning' 
                  ? 'text-primary' 
                  : 'text-gray-900 group-hover:text-primary'
                }
              `}>
                Plan Work with Your Team
              </h3>
              <p className="text-sm text-muted-foreground">
                Brainstorm solutions with AI experts in your field
              </p>
            </div>
          </div>
          
          {/* Selection indicator */}
          {selectedScenario === 'planning' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-2xl" />
          )}
        </button>
      </div>
    </div>
  );
};