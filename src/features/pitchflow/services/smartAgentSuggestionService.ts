
import { Agent } from '../../../shared/types/agent';
import { SmartAgentOrchestrator } from './agent/SmartAgentOrchestrator';

interface ProgressCallback {
  (progress: number, step: string): void;
}

export const generateSmartAgentSuggestions = async (
  topic: string, 
  userRole?: string, 
  onProgress?: ProgressCallback
): Promise<Agent[]> => {
  return SmartAgentOrchestrator.generateSmartAgentSuggestions(topic, userRole, onProgress);
};
