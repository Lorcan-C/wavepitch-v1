
import React, { useState, useEffect } from "react";
import { Button } from "../../../../../shared/ui/button";
import { Sparkles, RefreshCw, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { ExpertGenerationProgress } from "../../../../../shared/ui/expert-generation-progress";
import { SpeechEnabledInput } from "../../../../../shared/ui/speech-enabled-input";
import { DocumentUpload } from "../../../../../shared/ui/DocumentUpload";
import { MeetingDocument } from "../../../../../shared/types/document";

interface GeneratedExpert {
  id: string;
  name: string;
  role: string;
  description: string;
  isEditing: boolean;
  isExpanded?: boolean;
  isEditingDescription?: boolean;
}

interface ExpertManagementSectionProps {
  title: string;
  description: string;
  generatedExperts: GeneratedExpert[];
  hasGeneratedExperts: boolean;
  isGeneratingSuggestions: boolean;
  expertGenerationProgress: number;
  showExpertGenerationProgress: boolean;
  onGenerateExperts: () => void;
  onRegenerateExperts: () => void;
  onToggleExpertEdit: (expertId: string) => void;
  onUpdateExpert: (expertId: string, field: keyof GeneratedExpert, value: string) => void;
  onToggleExpansion?: (expertId: string) => void;
  onToggleDescriptionEdit?: (expertId: string) => void;
  generateButtonText?: string;
  variant?: 'simple' | 'detailed';
  additionalContext?: string;
  onAdditionalContextChange?: (value: string) => void;
  additionalDocuments?: MeetingDocument[];
  onAdditionalDocumentsChange?: (documents: MeetingDocument[]) => void;
  showAdditionalInputs?: boolean;
}

export const ExpertManagementSection = ({
  title,
  description,
  generatedExperts,
  hasGeneratedExperts,
  isGeneratingSuggestions,
  expertGenerationProgress,
  showExpertGenerationProgress,
  onGenerateExperts,
  onRegenerateExperts,
  onToggleExpertEdit,
  onUpdateExpert,
  onToggleDescriptionEdit,
  generateButtonText = "Generate Team Members",
  variant = 'simple',
  additionalContext = '',
  onAdditionalContextChange,
  additionalDocuments = [],
  onAdditionalDocumentsChange,
  showAdditionalInputs = false
}: ExpertManagementSectionProps) => {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  // Auto-expand descriptions when experts are generated
  useEffect(() => {
    if (hasGeneratedExperts && generatedExperts.length > 0) {
      setExpandedDescriptions(new Set(generatedExperts.map(expert => expert.id)));
    }
  }, [hasGeneratedExperts, generatedExperts]);

  const toggleDescription = (expertId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expertId)) {
        newSet.delete(expertId);
      } else {
        newSet.add(expertId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Header with inline regenerate button for generated experts */}
        {hasGeneratedExperts ? (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{title}</h3>
            <Button variant="outline" size="sm" onClick={onRegenerateExperts}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          </div>
        ) : (
          <h3 className="text-lg font-medium mb-3">{title}</h3>
        )}
        
        {!hasGeneratedExperts && !isGeneratingSuggestions && (
          <Button onClick={onGenerateExperts} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            {generateButtonText}
          </Button>
        )}

        {showExpertGenerationProgress && (
          <ExpertGenerationProgress
            progress={expertGenerationProgress}
            isVisible={showExpertGenerationProgress}
          />
        )}

        {hasGeneratedExperts && (
          <div className="space-y-3">
            {generatedExperts.map((expert) => (
              <div key={expert.id} className={`border rounded-lg ${variant === 'detailed' ? 'p-3 hover:border-muted-foreground/40 transition-colors' : 'p-4'}`}>
                <div className="flex justify-between items-start mb-2">
                  {expert.isEditing ? (
                    <input
                      value={variant === 'detailed' ? expert.role : expert.name}
                      onChange={(e) => onUpdateExpert(expert.id, variant === 'detailed' ? 'role' : 'name', e.target.value)}
                      className={`font-medium text-sm border-b border-dashed border-muted-foreground bg-transparent ${variant === 'detailed' ? 'text-base border-b-2 border-primary w-full focus:outline-none' : ''}`}
                      onBlur={() => onToggleExpertEdit(expert.id)}
                      onKeyDown={(e) => e.key === 'Enter' && onToggleExpertEdit(expert.id)}
                      autoFocus
                    />
                  ) : (
                    <h4 
                      className={`font-medium text-sm cursor-pointer group flex items-center gap-2 ${variant === 'detailed' ? 'text-base hover:border-b hover:border-dashed hover:border-muted-foreground mb-2 pb-1 transition-all' : 'hover:text-primary'}`}
                      onClick={() => onToggleExpertEdit(expert.id)}
                    >
                      {variant === 'detailed' ? expert.role : expert.name}
                      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </h4>
                  )}
                </div>
                
                {variant === 'simple' && (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">{expert.role}</p>
                    <p className="text-xs text-muted-foreground">{expert.description}</p>
                  </>
                )}
                
                {variant === 'detailed' && (
                  <div className="space-y-2">
                    {/* See role description button */}
                    <button
                      onClick={() => toggleDescription(expert.id)}
                      className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      {expandedDescriptions.has(expert.id) ? (
                        <>
                          Hide role description
                          <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          See role description
                          <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>

                    {/* Expanded description */}
                    {expandedDescriptions.has(expert.id) && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground italic">Click to edit description</p>
                        <div>
                          {expert.isEditingDescription ? (
                            <textarea
                              value={expert.description}
                              onChange={(e) => onUpdateExpert(expert.id, 'description', e.target.value)}
                              className="text-sm w-full bg-transparent border-2 border-dashed border-primary rounded p-2 focus:outline-none resize-none"
                              onBlur={() => onToggleDescriptionEdit?.(expert.id)}
                              onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && onToggleDescriptionEdit?.(expert.id)}
                              rows={3}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group flex items-start gap-2 p-2 bg-muted/30 rounded"
                              onClick={() => onToggleDescriptionEdit?.(expert.id)}
                            >
                              <div className="flex-1">
                                {expert.description}
                              </div>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {showAdditionalInputs && (
              <div className="space-y-4">
                <h4 className="text-md font-medium">Add anything else they should know</h4>
                
                <div className="space-y-2">
                  <DocumentUpload
                    documents={additionalDocuments}
                    onDocumentsChange={onAdditionalDocumentsChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <SpeechEnabledInput
                    value={additionalContext}
                    onChange={onAdditionalContextChange}
                    placeholder="Any additional context, background information, or specific details the client team should be aware of..."
                    variant="textarea"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
