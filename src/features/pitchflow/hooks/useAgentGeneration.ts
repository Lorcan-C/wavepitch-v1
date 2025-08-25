
import { useState } from "react";
import { generateSmartAgentSuggestions } from "../services/smartAgentSuggestionService";
import { Agent } from "../../../shared/types/agent";
import { toast } from "sonner";

interface GeneratedExpert {
  id: string;
  name: string;
  role: string;
  description: string;
  isEditing: boolean;
  isExpanded: boolean;
  isEditingDescription: boolean;
}

export const useAgentGeneration = () => {
  const [userRole, setUserRole] = useState("");
  const [generatedExperts, setGeneratedExperts] = useState<GeneratedExpert[]>([]);
  const [hasGeneratedExperts, setHasGeneratedExperts] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [expertGenerationProgress, setExpertGenerationProgress] = useState(0);
  const [showExpertGenerationProgress, setShowExpertGenerationProgress] = useState(false);

  const generateExpertTeam = async (topic: string, userRole?: string, callback?: (experts: GeneratedExpert[]) => void) => {
    const role = userRole || '';
    if (!role.trim() || !topic.trim()) {
      toast.error("Please provide both your role and meeting topic");
      return;
    }
    
    setIsGeneratingSuggestions(true);
    setShowExpertGenerationProgress(true);
    setExpertGenerationProgress(0);
    
    try {
      console.log('Generating expert team for role:', role, 'topic:', topic);
      const startTime = Date.now();
      
      const suggestions = await generateSmartAgentSuggestions(
        topic, 
        role,
        (progress) => {
          setExpertGenerationProgress(progress);
        }
      );
      
      const endTime = Date.now();
      console.log(`Expert team generation completed in ${endTime - startTime}ms`);
      
      // Convert suggestions to editable experts
      const experts: GeneratedExpert[] = suggestions.map((agent, index) => ({
        id: `expert-${index}`,
        name: agent.name,
        role: agent.role || 'Expert',
        description: agent.description || 'Professional expert in their field',
        isEditing: false,
        isExpanded: false,
        isEditingDescription: false
      }));
      
      setGeneratedExperts(experts);
      setHasGeneratedExperts(true);
      
      // Call callback if provided
      callback?.(experts);
      
      // Hide progress after a short delay
      setTimeout(() => {
        setShowExpertGenerationProgress(false);
      }, 1000);
      
      toast.success(`Generated ${experts.length} expert advisors in ${((endTime - startTime) / 1000).toFixed(1)}s!`);
    } catch (error) {
      console.error('Error generating expert team:', error);
      toast.error("Failed to generate expert team. Please try again.");
      setShowExpertGenerationProgress(false);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const regenerateExpertTeam = async (topic: string) => {
    setHasGeneratedExperts(false);
    setGeneratedExperts([]);
    await generateExpertTeam(topic);
  };

  const toggleExpertEdit = (expertId: string) => {
    setGeneratedExperts(prev => prev.map(expert => 
      expert.id === expertId 
        ? { ...expert, isEditing: !expert.isEditing }
        : expert
    ));
  };

  const updateExpert = (expertId: string, field: keyof GeneratedExpert, value: string) => {
    setGeneratedExperts(prev => prev.map(expert => 
      expert.id === expertId 
        ? { ...expert, [field]: value }
        : expert
    ));
  };

  const toggleExpansion = (expertId: string) => {
    setGeneratedExperts(prev => prev.map(expert => 
      expert.id === expertId 
        ? { ...expert, isExpanded: !expert.isExpanded }
        : expert
    ));
  };

  const toggleDescriptionEdit = (expertId: string) => {
    setGeneratedExperts(prev => prev.map(expert => 
      expert.id === expertId 
        ? { ...expert, isEditingDescription: !expert.isEditingDescription }
        : expert
    ));
  };

  const resetAgentGeneration = () => {
    setUserRole("");
    setGeneratedExperts([]);
    setHasGeneratedExperts(false);
    setIsGeneratingSuggestions(false);
    setExpertGenerationProgress(0);
    setShowExpertGenerationProgress(false);
  };

  return {
    userRole,
    setUserRole,
    generatedExperts,
    hasGeneratedExperts,
    isGeneratingSuggestions,
    expertGenerationProgress,
    showExpertGenerationProgress,
    generateExpertTeam,
    regenerateExpertTeam,
    toggleExpertEdit,
    updateExpert,
    toggleExpansion,
    toggleDescriptionEdit,
    resetAgentGeneration
  };
};
