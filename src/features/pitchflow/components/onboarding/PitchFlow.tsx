import React, { useState } from "react";
import { Button } from "../../../../../shared/ui/button";
// TODO: Import PERPLEXITY_RESEARCH_ENABLED from app constants
const PERPLEXITY_RESEARCH_ENABLED = true; // Temporary constant
import { Sparkles, FileText, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { WorkflowContainer } from "./WorkflowContainer";
import { FormInputSection } from "./FormInputSection";
import { ExpertManagementSection } from "./ExpertManagementSection";
import { DocumentUpload } from "../../../../../shared/ui/DocumentUpload";
import { SpeechEnabledInput } from "../../../../../shared/ui/speech-enabled-input";
import { MeetingDocument } from "../../../../../shared/types/document";
import { toast } from "sonner";
import { clientOpportunityAnalysisService } from "../../services/clientOpportunityAnalysisService";
import { ResearchProgress } from "../../../../../shared/ui/research-progress";
import { ResearchStatusDot } from "../../../../../shared/ui/research-status-dot";
import { documentService } from "../../services/documentService";

import { simplePerplexityService } from "../../services/simplePerplexityService";

interface GeneratedExpert {
  id: string;
  name: string;
  role: string;
  description: string;
  isEditing: boolean;
  isExpanded: boolean;
  isEditingDescription: boolean;
}

interface PitchFlowProps {
  onBack: () => void;
  onComplete: (data: {
    documents: MeetingDocument[];
    pitchInfo: string;
    experts: GeneratedExpert[];
    meetingPurpose: string;
    meetingDescription: string;
    userDescription: string;
    additionalDocuments: MeetingDocument[];
    additionalContext: string;
  }) => void;
  generatedExperts: GeneratedExpert[];
  isGeneratingSuggestions: boolean;
  expertGenerationProgress: number;
  showExpertGenerationProgress: boolean;
  onGenerateExpertTeam: (info: string, documents: MeetingDocument[], callback?: (experts: GeneratedExpert[]) => void) => void;
  onRegenerateExpertTeam: () => void;
  onToggleExpertEdit: (expertId: string) => void;
  onUpdateExpert: (expertId: string, field: keyof GeneratedExpert, value: string) => void;
  onToggleExpansion: (expertId: string) => void;
  onToggleDescriptionEdit: (expertId: string) => void;
  hasGeneratedExperts: boolean;
  onExpertsGenerated?: (experts: GeneratedExpert[]) => void;
}

export const PitchFlow = ({
  onBack,
  onComplete,
  generatedExperts,
  isGeneratingSuggestions,
  expertGenerationProgress,
  showExpertGenerationProgress,
  onGenerateExpertTeam,
  onRegenerateExpertTeam,
  onToggleExpertEdit,
  onUpdateExpert,
  onToggleExpansion,
  onToggleDescriptionEdit,
  hasGeneratedExperts,
  onExpertsGenerated
}: PitchFlowProps) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [documents, setDocuments] = useState<MeetingDocument[]>([]);
  const [pitchInfo, setPitchInfo] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [additionalDocuments, setAdditionalDocuments] = useState<MeetingDocument[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [showMeetingDescription, setShowMeetingDescription] = useState(false);
  const [showUserDescription, setShowUserDescription] = useState(false);
  const [isEditingMeetingDescription, setIsEditingMeetingDescription] = useState(false);
  const [isEditingUserDescription, setIsEditingUserDescription] = useState(false);
  const [researchResults, setResearchResults] = useState("");
  const [isPerformingResearch, setIsPerformingResearch] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [isEditingResearch, setIsEditingResearch] = useState(false);

  // Update meeting description when experts are generated
  React.useEffect(() => {
    if (hasGeneratedExperts && generatedExperts.length > 0 && meetingPurpose && !meetingDescription) {
      generateDescriptions();
    }
  }, [hasGeneratedExperts, generatedExperts, meetingPurpose]);

  const generateDescriptions = async () => {
    if (!meetingPurpose || generatedExperts.length === 0) return;
    
    try {
      setIsGeneratingDescriptions(true);
      
      const opportunity = meetingPurpose.replace("", "");
      
      // Generate enhanced descriptions with expert context
      const [enhancedMeetingDesc, userDesc] = await Promise.all([
        clientOpportunityAnalysisService.generateEnhancedMeetingDescription(documents, pitchInfo, opportunity, generatedExperts),
        clientOpportunityAnalysisService.generateUserDescription(documents, pitchInfo, generatedExperts)
      ]);
      
      setMeetingDescription(enhancedMeetingDesc);
      setUserDescription(userDesc);
      
    } catch (error) {
      console.error('Failed to generate descriptions:', error);
      toast.error("Failed to generate meeting descriptions");
    } finally {
      setIsGeneratingDescriptions(false);
    }
  };



  const handleGenerateExperts = async () => {
    const documentContext = documents.length > 0 ? documentService.getDocumentContext() : '';
    const info = documentContext ? 
      `Pitch presentation with documents:\n${documentContext}` + 
      (pitchInfo.trim() ? `\n\nAdditional context: ${pitchInfo}` : '') :
      pitchInfo;
    
    if (!info.trim()) {
      toast.error("Please provide pitch information or upload documents");
      return;
    }
    
    try {
      // Generate meeting purpose first
      const opportunity = await clientOpportunityAnalysisService.extractOpportunity(documents, pitchInfo);
      setMeetingPurpose(`${opportunity}`);
      
    } catch (error) {
      console.error('Failed to generate opportunity:', error);
      setMeetingPurpose("Preparation for client pitch presentation");
      toast.error("Failed to generate meeting purpose");
    }
    
    
    // Generate expert team with callback
    const expertsGeneratedCallback = (experts: GeneratedExpert[]) => {
      onExpertsGenerated?.(experts);
    };
    
    onGenerateExpertTeam(info, documents, expertsGeneratedCallback);
    setCurrentStep(2);
  };

  const handleResearchMarket = async () => {
    if (!meetingPurpose?.trim()) {
      toast.error("Please generate meeting purpose first");
      return;
    }

    setIsPerformingResearch(true);
    try {
      const researchQuery = meetingPurpose;
      const results = await simplePerplexityService.performResearch(researchQuery);
      setResearchResults(results);
      setShowResearch(true);
      toast.success("Market research completed");
    } catch (error) {
      console.error('Research failed:', error);
      toast.error("Failed to complete market research");
    } finally {
      setIsPerformingResearch(false);
    }
  };

  const handleComplete = () => {
    if (!meetingPurpose.trim()) {
      toast.error("Please specify the meeting purpose");
      return;
    }
    
    // Include research in additional context
    let finalAdditionalContext = additionalContext;
    if (researchResults.trim()) {
      finalAdditionalContext += `\n\n=== MARKET RESEARCH ===\n${researchResults}\n=== END RESEARCH ===\n`;
    }
    
    onComplete({
      documents,
      pitchInfo,
      experts: generatedExperts,
      meetingPurpose,
      meetingDescription,
      userDescription,
      additionalDocuments,
      additionalContext: finalAdditionalContext
    });
  };

  const canProceedFromStep1 = documents.length > 0 || pitchInfo.trim();

  // Determine the top action button (disabled for step 1)
  const getTopActionButton = () => {
    if (currentStep === 1) {
      return null; // Disable top button for step 1
    } else {
      return (
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleComplete} 
            disabled={!meetingPurpose.trim() || !hasGeneratedExperts || isGeneratingDescriptions}
            size="sm"
          >
            {isGeneratingDescriptions ? "Preparing..." : "Start Meeting"}
          </Button>
        </div>
      );
    }
  };

  // Determine the bottom action button (fully functional)
  const getActionButton = () => {
    if (currentStep === 1) {
      return (
        <Button 
          onClick={handleGenerateExperts}
          disabled={!canProceedFromStep1}
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate experts
        </Button>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleComplete} 
            disabled={!meetingPurpose.trim() || !hasGeneratedExperts || isGeneratingDescriptions}
            size="sm"
          >
            {isGeneratingDescriptions ? "Preparing..." : "Start Meeting"}
          </Button>
        </div>
      );
    }
  };

  return (
    <WorkflowContainer
      title="Pitch a new project"
      icon={<FileText className="mr-2 h-5 w-5 text-[#0EA5E9]" />}
      onBack={onBack}
      actionButton={getTopActionButton()}
      bottomActionButton={getActionButton()}
      currentStep={currentStep}
      totalSteps={2}
    >
      {currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium">
            Describe your client, their needs, or your key ideas, and/or upload relevant documents below.
          </label>
          <div className="space-y-2 p-4 bg-muted rounded-lg border border-dashed border-primary">
            <SpeechEnabledInput
              value={pitchInfo}
              onChange={setPitchInfo}
              placeholder="Type here or click mic for voice input"
              variant="textarea"
              rows={4}
            />
            <DocumentUpload
              documents={documents}
              onDocumentsChange={setDocuments}
              userContext={pitchInfo}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Meeting purpose & goals - enhanced section */}
          {meetingPurpose && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Meeting purpose & goals</h3>
              
              {/* Meeting Overview */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{meetingPurpose}</p>
              </div>

              {/* Research Market Button */}
              {PERPLEXITY_RESEARCH_ENABLED && meetingPurpose && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleResearchMarket}
                    disabled={isPerformingResearch}
                    size="sm"
                    variant="outline"
                  >
                    {isPerformingResearch ? "Researching..." : "Research Market"}
                  </Button>
                  {researchResults && (
                    <span className="text-xs text-muted-foreground">
                      Research completed
                    </span>
                  )}
                </div>
              )}

              {/* Research Results */}
              {PERPLEXITY_RESEARCH_ENABLED && researchResults && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowResearch(!showResearch)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    {showResearch ? (
                      <>
                        Hide research
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        See research
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>

                  {showResearch && (
                    <div className="mt-2">
                      {isEditingResearch ? (
                        <textarea
                          value={researchResults}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 1000) {
                              setResearchResults(value);
                            }
                          }}
                          className="text-sm w-full bg-transparent border-2 border-dashed border-primary rounded p-2 focus:outline-none resize-none"
                          onBlur={() => setIsEditingResearch(false)}
                          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && setIsEditingResearch(false)}
                          rows={6}
                          autoFocus
                          maxLength={5000}
                        />
                      ) : (
                        <div 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group flex items-start gap-2 p-2 bg-muted/30 rounded"
                          onClick={() => setIsEditingResearch(true)}
                        >
                          <div className="flex-1 whitespace-pre-wrap">
                            {researchResults}
                          </div>
                          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5 flex-shrink-0" />
                        </div>
                      )}
                      {researchResults && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {researchResults.length}/1000 characters
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Meeting Description */}
              {(meetingDescription || isGeneratingDescriptions) && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowMeetingDescription(!showMeetingDescription)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    {showMeetingDescription ? (
                      <>
                        Hide meeting description
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        See meeting description
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>

                  {showMeetingDescription && (
                    <div className="mt-2">
                      {isGeneratingDescriptions ? (
                        <div className="text-sm text-muted-foreground p-2 bg-muted/30 rounded animate-pulse">
                          Generating personalized meeting description with your client team...
                        </div>
                      ) : isEditingMeetingDescription ? (
                        <textarea
                          value={meetingDescription}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 300) {
                              setMeetingDescription(value);
                            }
                          }}
                          className="text-sm w-full bg-transparent border-2 border-dashed border-primary rounded p-2 focus:outline-none resize-none"
                          onBlur={() => setIsEditingMeetingDescription(false)}
                          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && setIsEditingMeetingDescription(false)}
                          rows={3}
                          autoFocus
                          maxLength={300}
                        />
                      ) : (
                        <div 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group flex items-start gap-2 p-2 bg-muted/30 rounded"
                          onClick={() => setIsEditingMeetingDescription(true)}
                        >
                          <div className="flex-1">
                            {meetingDescription}
                          </div>
                          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5 flex-shrink-0" />
                        </div>
                      )}
                      {meetingDescription && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {meetingDescription.length}/300 characters
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Your Role */}
              {(userDescription || isGeneratingDescriptions) && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowUserDescription(!showUserDescription)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    {showUserDescription ? (
                      <>
                        Hide your role
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        See your role
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>

                  {showUserDescription && (
                    <div className="mt-2">
                      {isGeneratingDescriptions ? (
                        <div className="text-sm text-muted-foreground p-2 bg-muted/30 rounded animate-pulse">
                          Analyzing your role based on the pitch materials...
                        </div>
                      ) : isEditingUserDescription ? (
                        <textarea
                          value={userDescription}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 200) {
                              setUserDescription(value);
                            }
                          }}
                          className="text-sm w-full bg-transparent border-2 border-dashed border-primary rounded p-2 focus:outline-none resize-none"
                          onBlur={() => setIsEditingUserDescription(false)}
                          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && setIsEditingUserDescription(false)}
                          rows={2}
                          autoFocus
                          maxLength={200}
                        />
                      ) : (
                        <div 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group flex items-start gap-2 p-2 bg-muted/30 rounded"
                          onClick={() => setIsEditingUserDescription(true)}
                        >
                          <div className="flex-1">
                            {userDescription}
                          </div>
                          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5 flex-shrink-0" />
                        </div>
                      )}
                      {userDescription && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {userDescription.length}/200 characters
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <ExpertManagementSection
            title="Three experts will join your meeting"
            description="Based on your role and meeting purpose, we'll generate relevant team members to collaborate with."
            generatedExperts={generatedExperts}
            hasGeneratedExperts={hasGeneratedExperts}
            isGeneratingSuggestions={isGeneratingSuggestions}
            expertGenerationProgress={expertGenerationProgress}
            showExpertGenerationProgress={showExpertGenerationProgress}
            onGenerateExperts={handleGenerateExperts}
            onRegenerateExperts={onRegenerateExpertTeam}
            onToggleExpertEdit={onToggleExpertEdit}
            onUpdateExpert={onUpdateExpert}
            onToggleExpansion={onToggleExpansion}
            onToggleDescriptionEdit={onToggleDescriptionEdit}
            generateButtonText="Generate Client Team"
            variant="detailed"
            additionalContext={additionalContext}
            onAdditionalContextChange={setAdditionalContext}
            additionalDocuments={additionalDocuments}
            onAdditionalDocumentsChange={setAdditionalDocuments}
            showAdditionalInputs={false}
          />
          

        </div>
      )}
    </WorkflowContainer>
  );
};
