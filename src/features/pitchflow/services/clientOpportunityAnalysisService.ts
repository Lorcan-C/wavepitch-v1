import { openAIService } from './ai/OpenAIService';
import { MeetingDocument } from '../../../shared/types/document';
import { langfuseService } from './langfuseService';
import { prompts, fill } from '../../../shared/lib/prompts';

interface GeneratedExpert {
  id: string;
  name: string;
  role: string;
  description: string;
  isEditing: boolean;
  isExpanded: boolean;
  isEditingDescription: boolean;
}

class ClientOpportunityAnalysisService {
  async extractOpportunity(documents: MeetingDocument[], pitchInfo: string): Promise<string> {
    console.log('[ClientOpportunityAnalysisService] === DEBUGGING EXTRACT OPPORTUNITY ===');
    console.log('[ClientOpportunityAnalysisService] Input values:', { 
      pitchInfo: pitchInfo || 'EMPTY', 
      documentsLength: documents?.length || 0
    });
    
    // Ensure proper variable formatting
    const documentsText = documents?.length > 0 
      ? documents.map(d => `${d.filename}: ${d.summary || d.content.substring(0, 500)}`).join('\n')
      : 'No documents provided';
    
    console.log('[ClientOpportunityAnalysisService] Documents text preview:', documentsText.substring(0, 200) + '...');
    
    const compilationVars = {
      pitchInfo,
      documents: documentsText
    };
    
    console.log('[ClientOpportunityAnalysisService] Compilation variables:', compilationVars);
    
    // DIAGNOSTIC: Check environment variables
    console.log('[ClientOpportunityAnalysisService] Environment check:', {
      hasPublicKey: !!import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
      hasSecretKey: !!import.meta.env.VITE_LANGFUSE_SECRET_KEY,
      baseUrl: import.meta.env.VITE_LANGFUSE_BASEURL || 'DEFAULT'
    });
    
    // DIAGNOSTIC: Test direct langfuse service call
    try {
      console.log('[ClientOpportunityAnalysisService] Testing direct langfuse call...');
      const directPrompt = await langfuseService.getPrompt('meeting-system/pre-meeting/meeting-generation/extract-opportunity');
      console.log('[ClientOpportunityAnalysisService] Direct call SUCCESS, prompt preview:', directPrompt.text.substring(0, 100));
    } catch (directError) {
      console.error('[ClientOpportunityAnalysisService] Direct langfuse call FAILED:', directError.message);
      console.error('[ClientOpportunityAnalysisService] Full error:', directError);
    }
    
    // DIAGNOSTIC: Test prompts.ts function call
    let prompt;
    try {
      console.log('[ClientOpportunityAnalysisService] Testing prompts.ts function call...');
      prompt = await prompts.preMeeting.meetingGeneration.extractOpportunity(compilationVars);
      console.log('[ClientOpportunityAnalysisService] Prompts.ts call SUCCESS');
    } catch (promptsError) {
      console.error('[ClientOpportunityAnalysisService] Prompts.ts call FAILED:', promptsError.message);
      console.error('[ClientOpportunityAnalysisService] Full prompts error:', promptsError);
      throw promptsError; // Re-throw to maintain current behavior
    }
    
    console.log('[ClientOpportunityAnalysisService] Compiled prompt length:', prompt.length);
    console.log('[ClientOpportunityAnalysisService] Compiled prompt preview:', prompt.substring(0, 300) + '...');
    console.log('[ClientOpportunityAnalysisService] === END DEBUGGING ===');

    const response = await openAIService.generateText([{
      role: 'user',
      content: prompt
    }]);

    return response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }

  async generateEnhancedMeetingDescription(documents: MeetingDocument[], pitchInfo: string, opportunity: string, generatedExperts: GeneratedExpert[] = []): Promise<string> {
    console.log('[ClientOpportunityAnalysisService] === DEBUGGING ENHANCED MEETING DESCRIPTION ===');
    console.log('[ClientOpportunityAnalysisService] Input values:', { 
      pitchInfo: pitchInfo || 'EMPTY',
      opportunity: opportunity || 'EMPTY',
      documentsLength: documents?.length || 0,
      expertsLength: generatedExperts?.length || 0
    });
    
    // Build context about the specific generated experts
    const expertContext = generatedExperts?.length > 0 
      ? `\n\nGenerated Client Team:\n${generatedExperts.map((expert, index) => 
          `${index + 1}. ${expert.name} - ${expert.role}`
        ).join('\n')}`
      : '';

    const documentsText = documents?.length > 0
      ? documents.map(d => `${d.filename}: ${d.summary || d.content.substring(0, 300)}`).join('\n')
      : 'No documents provided';
    
    const compilationVars = {
      opportunity: opportunity || '',
      pitchInfo: pitchInfo || '',
      documents: documentsText,
      expertContext: expertContext || ''
    };
    
    console.log('[ClientOpportunityAnalysisService] Compilation variables:', compilationVars);
    
    const prompt = fill(prompts.preMeeting.clientOpportunityAnalysis.enhancedMeetingDescription, compilationVars);
    
    console.log('[ClientOpportunityAnalysisService] Compiled prompt length:', prompt.length);
    console.log('[ClientOpportunityAnalysisService] Compiled prompt preview:', prompt.substring(0, 300) + '...');
    console.log('[ClientOpportunityAnalysisService] === END DEBUGGING ===');

    const response = await openAIService.generateText([{
      role: 'user',
      content: prompt
    }]);

    const description = response.trim().replace(/^["']|["']$/g, '');
    return description.length > 300 ? description.substring(0, 297) + '...' : description;
  }

  async generateUserDescription(documents: MeetingDocument[], pitchInfo: string, generatedExperts: GeneratedExpert[] = []): Promise<string> {
    console.log('[ClientOpportunityAnalysisService] === DEBUGGING USER DESCRIPTION ===');
    console.log('[ClientOpportunityAnalysisService] Input values:', { 
      pitchInfo: pitchInfo || 'EMPTY',
      documentsLength: documents?.length || 0,
      expertsLength: generatedExperts?.length || 0
    });
    
    // Build context about the specific generated experts
    const expertContext = generatedExperts?.length > 0 
      ? `\n\nGenerated Client Team:\n${generatedExperts.map((expert, index) => 
          `${index + 1}. ${expert.name} - ${expert.role}`
        ).join('\n')}\n\nThe user will be presenting to this specific team.`
      : '';

    const documentsText = documents?.length > 0
      ? documents.map(d => `${d.filename}: ${d.summary || d.content.substring(0, 300)}`).join('\n')
      : 'No documents provided';
      
    const relationshipContext = generatedExperts?.length > 0 ? 
      `How they relate to the specific client team they'll be presenting to` : 
      'Their relationship to potential stakeholders';
    
    const compilationVars = {
      pitchInfo: pitchInfo || '',
      documents: documentsText,
      expertContext: expertContext || '',
      relationshipContext: relationshipContext || ''
    };
    
    console.log('[ClientOpportunityAnalysisService] Compilation variables:', compilationVars);
    
    const prompt = fill(prompts.preMeeting.clientOpportunityAnalysis.userDescription, compilationVars);
    
    console.log('[ClientOpportunityAnalysisService] Compiled prompt length:', prompt.length);
    console.log('[ClientOpportunityAnalysisService] Compiled prompt preview:', prompt.substring(0, 300) + '...');
    console.log('[ClientOpportunityAnalysisService] === END DEBUGGING ===');

    const response = await openAIService.generateText([{
      role: 'user',
      content: prompt
    }]);

    const description = response.trim().replace(/^["']|["']$/g, '');
    return description.length > 200 ? description.substring(0, 197) + '...' : description;
  }
}

export const clientOpportunityAnalysisService = new ClientOpportunityAnalysisService();
