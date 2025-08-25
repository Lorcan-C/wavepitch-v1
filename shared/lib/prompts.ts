// src/lib/prompts.ts
// Central prompt management - Organized by chronological meeting flow
import { langfuseService } from '../../src/features/pitchflow/services/langfuseService';
// ============================================================================
// SECTION 1: GENERAL UTILITIES - Structure templates, utilities, and helpers
// ============================================================================

export const structure = {
  meetingPurpose: {
    withContext: async (vars: { goal: string, meetingDescription: string }) => {
      const prompt = await langfuseService.getPrompt("structure-meeting-purpose");
      return prompt.compile(vars);
    },
    
    fallback: async () => {
      const prompt = await langfuseService.getPrompt("structure-meeting-purpose-fallback");
      return prompt.text;
    },
    
    noContext: async () => {
      const prompt = await langfuseService.getPrompt("structure-meeting-purpose-no-context");
      return prompt.text;
    }
  },
  agentProfile: {
    template: `## Agent Profile
Name: {name}
Role: {role}
Organization: {organization}
Meeting Context: {meetingContext}
Relationship to User: {relationshipToUser}
Decision Making Authority: {decisionMakingAuthority}
Description: {description}`,
    
    fallback: "## Agent Profile\n\nNo specific agent profile available."
  },
  conversationSummary: {
    beginning: "## Meeting Summary\n\nNo conversation has started yet. This is the beginning of the meeting.",
    
    shortConversation: "## Meeting Summary\n\n**Recent Conversation:**\n\n{messages}",
    
    longConversation: `## Meeting Summary
**Earlier Discussion Summary:**
{aiSummary}
**Recent Messages:**
{recentMessages}
**Last speaker:** {lastSpeaker}`,
    
    withFallback: `## Meeting Summary
**Earlier Discussion:** {olderMessageCount} messages exchanged previously.
**Recent Messages:**
{recentMessages}
**Last speaker:** {lastSpeaker}`
  },
  additionalContext: {
    screenShare: "## Additional Context\n\n**Screen Share Analysis:**{screenContext}",
    
    documents: "## Additional Context\n\n**Document Context:**{documentContext}",
    
    none: "## Additional Context\n\nNo additional context available."
  },
  messageFormats: {
    participant: "**{senderName}{senderDescription}:** {content}\n\n",
    
    transcript: "{senderName}{senderDescription}: {content}\n"
  }
};

export const expertTypes = {
  bigPicture: "create ONE advisor who provides high-level, big-picture guidance for someone in this role/context",
  practical: "create ONE advisor who provides practical, step-by-step support for someone in this role/context", 
  creative: "create ONE advisor who brings creative or unconventional perspectives for someone in this role/context"
};

export const agentEnhancement = "Rewrite the following character description to be clearer, more specific, and behaviorally rich. Preserve the original intent and keep it concise. Focus on who this person is, how they communicate, their expertise, and their personality traits.";

export const organizationalContextInference = `Based on this agent profile and meeting context, determine:
1. What organization does this agent represent or work for?
2. What is their role in this meeting (e.g., 'receiving proposal', 'internal stakeholder', 'decision maker', 'consultant', 'vendor')?

Agent: {agentName} - {agentDescription}
Agent Role: {agentRole}
Meeting Topic: {meetingPurpose}

Analyze the context and respond with JSON in this exact format:
{"organization": "...", "meetingContext": "..."}

If no clear organization is mentioned, use "Independent" or the most logical inference.
If meeting context is unclear, use "Participant" as the default.`;

// UTILITY FUNCTIONS
export function fill(template: string, vars: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (_, key) => vars[key] || `{${key}}`);
}

export function buildSystemMessage(prompt: string, vars?: Record<string, any>): { role: 'system', content: string } {
  return {
    role: 'system',
    content: vars ? fill(prompt, vars) : prompt
  };
}

export function buildUserMessage(prompt: string, vars?: Record<string, any>): { role: 'user', content: string } {
  return {
    role: 'user', 
    content: vars ? fill(prompt, vars) : prompt
  };
}

// AGENT GENERATION HELPER UTILITIES
export function buildPreviousExpertsContext(previousExperts: any[]): string {
  if (!previousExperts || previousExperts.length === 0) {
    return "No previous experts selected yet.";
  }
  return previousExperts.map(expert => 
    `- ${expert.name} (${expert.role}): ${expert.expertise}`
  ).join('\n');
}

export function buildWorkplaceExpertPrompt(expertType: any): string {
  if (expertType?.name === "Big-picture") {
    return "create ONE workplace advisor who provides strategic, high-level guidance on workplace matters";
  } else if (expertType?.name === "Practical / step-by-step") {
    return "create ONE workplace advisor who provides practical, step-by-step workplace implementation support";
  } else if (expertType?.name === "Creative Problem Solver") {
    return "create ONE workplace advisor who brings creative or innovative approaches to workplace challenges";
  }
  return expertType?.prompt || "create ONE workplace advisor";
}

export function buildPersonalWorkplaceExpertPrompt(expertType: any): string {
  if (expertType?.name === "Big-picture") {
    return "create ONE workplace professional who provides strategic guidance on personal workplace matters";
  } else if (expertType?.name === "Practical / step-by-step") {
    return "create ONE workplace professional who provides practical, actionable advice on personal workplace issues";
  } else if (expertType?.name === "Creative Problem Solver") {
    return "create ONE workplace professional who brings creative solutions to personal workplace challenges";
  }
  return expertType?.prompt || "create ONE workplace professional";
}

export function buildComplementaryWorkplacePrompt(expertType: any): string {
  if (expertType?.name === "Big-picture") {
    return "create ONE complementary workplace participant who provides strategic, organizational perspective";
  } else if (expertType?.name === "Practical / step-by-step") {
    return "create ONE complementary workplace participant who provides tactical, implementation-focused guidance";
  } else if (expertType?.name === "Creative Problem Solver") {
    return "create ONE complementary workplace participant who brings innovative workplace solutions";
  }
  return expertType?.prompt || "create ONE complementary workplace participant";
}

// ============================================================================
// SECTION 2: MAIN PROMPTS - Organized by chronological meeting workflow
// ============================================================================

export const prompts = {
  // PHASE 1: PRE-MEETING SETUP
  preMeeting: {
    // Person Detection - Analyzing meeting requests for specific people
    personDetection: {
      analyzeRequest: async () => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/person-detection/analyze-request");
        return prompt.text;
      }
    },

    // Document Processing - Analyzing uploaded documents
    documentProcessing: {
      analysisPrompt: async (vars: { filename: string, content: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/document-processing/analysis-prompt");
        return prompt.compile(vars);
      },

      documentAnalysisWithContext: async (vars: { filename: string, userContext: string, content: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/document-processing/analysis-with-context");
        return prompt.compile(vars);
      },

      intelligenceAnalysis: async (vars: { userQuery: string, documentTitle: string, documentType: string, contentLength: number }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/document-processing/intelligence-analysis");
        return prompt.compile(vars);
      },

      queryAnalysis: async (vars: { userQuery: string, docSummaries: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/document-processing/query-analysis");
        return prompt.compile(vars);
      }
    },

    // Meeting Generation - Core meeting setup and configuration
    meetingGeneration: {
      extractOpportunity: async (vars: { pitchInfo: string, documents: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/meeting-generation/extract-opportunity");
        return prompt.compile(vars);
      },

      enhancedMeetingDescription: async (vars: { opportunity: string, pitchInfo: string, documents: string, expertContext: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/meeting-generation/enhanced-meeting-description");
        return prompt.compile(vars);
      },

      userDescription: async (vars: { pitchInfo: string, documents: string, expertContext: string, relationshipContext: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/meeting-generation/user-description");
        return prompt.compile(vars);
      },

      titleGeneration: async (vars: { inputText: string, meetingType: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/meeting-generation/title-generation");
        return prompt.compile(vars);
      },

      scenarioGeneration: {
        enhancedTopic: `{topic}{documentContext}{additionalContext}`,
        
        documentContext: `
Document Analysis:
{processedDocuments}
Key Requirements:
- Consider document insights for agent generation
- Ensure agents can address document-specific needs
- Match expertise to document complexity and scope`,

        basePromptBuilder: async (vars: { scenarioType: string, topic: string, userRole: string, meetingContext: string, documentsContext: string, agentCount: number }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/meeting-generation/scenario-base-prompt-builder");
          return prompt.compile(vars);
        }
      },

      scenarioTemplates: {
        clientPitchContext: `This is a client pitch meeting scenario. The user will be presenting to potential clients or stakeholders. Generate agents who would typically be present in such meetings - decision makers, technical evaluators, budget holders, and subject matter experts relevant to the pitch topic.`,
        virtualTeamContext: `This is a virtual team collaboration scenario. The user is working with a distributed team on a project. Generate agents who would be typical team members - project managers, developers, designers, analysts, and other roles that contribute to collaborative work.`,
        professionalDevContext: `This is a professional development scenario. The user is focused on learning, skill development, or career advancement. Generate agents who would be mentors, trainers, industry experts, or experienced professionals who can provide guidance and knowledge sharing.`
      }
    },

    // Research - Extract targets and generate research insights
    research: {
      extractTargets: async () => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/research/extract-targets");
        return prompt.text;
      },

      perplexitySystemPrompt: async (vars: { query: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/research/perplexity-system-prompt");
        return prompt.compile(vars);
      }
    },

    // Agent Generation - Create and enhance AI agents
    agentGeneration: {
      personSpecific: async (vars: { originalMention: string, name: string, role: string, relationship: string, expertise: string, topic: string, userRole: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/person-specific");
        return prompt.compile(vars);
      },

      personalWorkplace: async (vars: { topic: string, expertTypePrompt: string, previousExpertsContext: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/personal-workplace");
        return prompt.compile(vars);
      },

      workplace: async (vars: { topic: string, userRole: string, expertTypePrompt: string, previousExpertsContext: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/workplace");
        return prompt.compile(vars);
      },

      expert: async (vars: { topic: string, userRole: string, expertTypePrompt: string, previousExpertsContext: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/expert");
        return prompt.compile(vars);
      },

      complementaryWorkplace: async (vars: { topic: string, expertTypePrompt: string, existingContext: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/complementary-workplace");
        return prompt.compile(vars);
      },

      complementaryExpert: async (vars: { topic: string, userRole: string, expertTypePrompt: string, existingContext: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/complementary-expert");
        return prompt.compile(vars);
      },

      enhancement: {
        systemPrompt: async (vars: { originalDescription: string, agentName: string, agentRole: string }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/enhancement-system");
          return prompt.compile(vars);
        }
      },

      introduction: {
        contextual: async (vars: { agentName: string, agentDescription: string, meetingContext: string }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/introduction-contextual");
          return prompt.compile(vars);
        },

        fallback: {
          marketing: `Hi everyone, I'm {agentName}. I'm here to bring my {agentExpertise} perspective to our {meetingTitle} discussion and help drive strategic results.`,
          product: `Hello team, I'm {agentName}. I'm excited to contribute my {agentExpertise} insights to our {meetingTitle} planning and ensure we build something great.`,
          strategy: `Hi everyone, I'm {agentName}. I'm ready to apply my {agentExpertise} experience to our {meetingTitle} session and help shape our path forward.`,
          generic: `Hello team, I'm {agentName}. I'm looking forward to bringing my {agentExpertise} expertise to today's {meetingTitle} discussion and collaborating on solutions.`
        },

        context: {
          withGoal: `Meeting: "{meetingTitle}" with goal: {meetingGoal}`,
          withoutGoal: `Meeting: "{meetingTitle}"`
        }
      },

      customAgent: {
        roleDetection: async (vars: { userInput: string, documentContext: string }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/custom-agent-role-detection");
          return prompt.compile(vars);
        },

        roleIdentificationPrompt: `Based on the following professional context and information, identify the most appropriate role or job title for this person. Consider their background, expertise, and the context provided.
Context: {context}
Information: {information}
Respond with only the role title, nothing else.`,

        systemPrompt: `You are an expert at identifying professional roles based on context. Respond with only the role title, nothing else.`
      }
    },

    // Client Opportunity Analysis - Pitch-specific analysis
    clientOpportunityAnalysis: {
      extractOpportunity: `Based on the following pitch materials, extract a concise 10-15 word description of the specific client opportunity or business need being addressed.
Pitch Information: {pitchInfo}
Documents: {documents}
Return only the opportunity description, nothing else. Focus on the specific business need, market, or solution being pitched.`,

      enhancedMeetingDescription: `Generate a meeting prep description (max 300 characters) following this general pattern:
"Brainstorm [specific prep activity] with [relevant stakeholders] to [efficiently/rapidly/quickly] [achieve specific goal], [resulting in specific outcome]."
Guidelines:
1. Start with "Brainstorm"
2. Include relevant stakeholders - this could be:
   - Specific roles (CFO, tech lead) if mentioned/relevant
   - Team names (e.g., "the Wellcome team", "the procurement team")
   - Mix of both as appropriate to context
3. Use action-oriented speed words: rapidly, quickly, efficiently
4. Focus on concrete preparatory actions that match the context
5. End with the actual outcome/deliverable:
   - "resulting in a compelling proposal submission"
   - "leading to a winning pitch presentation"
   - "ensuring productive stakeholder alignment"
   - Or other outcomes clearly indicated by the context
Context to consider:
- Opportunity details
- Document content and requirements
- Stakeholders mentioned
- Desired outcomes stated or implied
Context:
- Opportunity: {opportunity}
- Pitch Information: {pitchInfo}
- Documents: {documents}{expertContext}
Generate ONE natural, contextually appropriate description based on the provided information.`,

      userDescription: `Based on the following pitch materials, generate a professional description of the
presenter's role and background.

Pitch Information: {pitchInfo}
Documents: {documents}{expertContext}

Analyze the context to understand:
- What role the presenter likely has
- Their expertise or background
- How they relate to the pitch/opportunity
- {relationshipContext}

Think deeply about:
- What specific experiences qualify them to present this pitch?
- What unique insights or advantages do they bring?
- What challenges have they overcome that relate to this opportunity?
- What metrics or outcomes do they prioritize?
- What is their track record with similar ventures/projects?
- How would they position themselves to this specific audience?

Consider their:
- Professional journey that led them to this pitch
- Domain expertise that makes them credible
- Network and relationships relevant to the opportunity
- Past successes or failures that inform their approach
- Communication style and how they'd present themselves
- Strategic vision for this opportunity
- Personal stake or motivation in this venture

Generate a professional description of "Your Role" in this pitch meeting:
Comprehensive 10-15 sentence description covering: Their relevant background and what shaped their viewpoint on this pitch/opportunity. The specific value they bring to THIS conversation. 2-3 questions they would naturally ask the audience. Key insights or examples they'd share from their experience. Any concerns or alternative viewpoints they'd raise. Their communication style (data-driven, story-based, direct, diplomatic). What success looks like from their perspective on this topic.`,

      personalityTraits: async (vars: { agentName: string, agentRole: string, agentExpertise: string, agentDescription: string, meetingTopic: string, contextType: string, userRole: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/agent-generation/personality-traits");
        return prompt.compile(vars);
      }
    }
  },

  // Unified Pitch Processing - Consolidates multiple services into single prompt system
  unifiedPitchProcessing: {
    processPitchInput: async (vars: { userInput: string, documents: string }) => {
      const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/unified-pitch-processing/process-pitch-input");
      return prompt.compile(vars);
    },

    generateMeetingAgents: async (vars: { processedContext: string }) => {
      const prompt = await langfuseService.getPrompt("meeting-system/pre-meeting/unified-pitch-processing/generate-meeting-agents");
      return prompt.compile(vars);
    }
  },

  // PHASE 2: DURING MEETING
  duringMeeting: {
    // Conversation Flow - Chain of thought, response generation
    conversationFlow: {
      chainOfThought: async () => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/conversation-flow/chain-of-thought");
        return prompt.text;
      },

      responseInstructions: async () => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/conversation-flow/response-instructions");
        return prompt.text;
      },

      structuredResponseFormat: async () => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/conversation-flow/structured-response-format");
        return prompt.text;
      },

      layerCombination: async (vars: { layer1: string, layer2: string, layer3: string, layer4: string, finalInstructions: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/conversation-flow/layer-combination");
        return prompt.compile(vars);
      },

      finalInstructions: async (vars: { agentName: string, agentRole: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/conversation-flow/final-instructions");
        return prompt.compile(vars);
      }
    },

    // Context Management - Conversation summaries, context system
    contextManagement: {
      conversationSummary: async (vars: { summaryMaxWords: string, messageText: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/context-management/conversation-summary");
        return prompt.compile(vars);
      },

      meetingSummary: async (vars: { transcript: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/context-management/meeting-summary");
        return prompt.compile(vars);
      },

      fallbackConversationSummary: async (vars: { olderMessageCount: string, recentMessages: string, lastSpeaker: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/context-management/fallback-conversation-summary");
        return prompt.compile(vars);
      },

      agentContextSummary: async (vars: { messages: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/context-management/agent-context-summary");
        return prompt.compile(vars);
      }
    },

    // Real-time Analysis - Screen analysis, document intelligence
    realTimeAnalysis: {
      visionAnalysis: {
        screenshotAnalysis: async () => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/real-time-analysis/vision-analysis/screenshot-analysis");
          return prompt.text;
        },

        openAIVisionAnalysis: async () => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/real-time-analysis/vision-analysis/openai-vision-analysis");
          return prompt.text;
        }
      },

      screenAnalysis: {
        contextTemplate: async (vars: { confidence: string, analysisContent: string, keyElements: string, insights: string, timestamp: string }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/real-time-analysis/screen-analysis/context-template");
          return prompt.compile(vars);
        },

        fallbackContext: async (vars: { reason: string }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/real-time-analysis/screen-analysis/fallback-context");
          return prompt.compile(vars);
        }
      }
    },

    // Communication Utils - System prompts, message building
    communicationUtils: {
      buildSystemPrompt: async (vars: { 
        agentName: string, 
        agentRole: string, 
        agentDescription: string, 
        relationshipContext: string, 
        enhancedProfile: string, 
        generationContext: string, 
        agentExpertise: string, 
        introductionAwareness: string, 
        relationshipInstructions: string, 
        phaseInstructions: string, 
        screenContext: string, 
        communicationStyle: string, 
        languageInstructions: string 
      }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/communication-utils/build-system-prompt");
        return prompt.compile(vars);
      },

      geminiSystemPrompts: {
        base: async (vars: { role: string, description: string, context: string, expertise: string }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/communication-utils/gemini-system-prompts/base");
          return prompt.compile(vars);
        },

        blufStyle: async () => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/communication-utils/gemini-system-prompts/bluf-style");
          return prompt.text;
        },

        newContext: async (vars: { newContextInfo: string }) => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/communication-utils/gemini-system-prompts/new-context");
          return prompt.compile(vars);
        },

        modelUnderstanding: async () => {
          const prompt = await langfuseService.getPrompt("meeting-system/during-meeting/communication-utils/gemini-system-prompts/model-understanding");
          return prompt.text;
        }
      }
    }
  },

  // PHASE 3: POST-MEETING
  postMeeting: {
    // Summary Generation - Comprehensive meeting summaries
    summaryGeneration: {
      comprehensiveSummary: async () => {
        const prompt = await langfuseService.getPrompt("meeting-system/post-meeting/summary-generation/comprehensive-summary");
        return prompt.text;
      }
    },

    // Analysis Reporting - Detailed meeting analysis
    analysisReporting: {
      comprehensiveAnalysis: async (vars: { conversation: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/post-meeting/analysis-reporting/comprehensive-analysis");
        return prompt.compile(vars);
      },

      analysisPrompt: async (vars: { transcript: string }) => {
        const prompt = await langfuseService.getPrompt("meeting-system/post-meeting/analysis-reporting/analysis-prompt");
        return prompt.compile(vars);
      }
    }
  },

  // Scenario Context - Meeting scenario templates
  scenarioContext: {
    clientPitch: async () => {
      const prompt = await langfuseService.getPrompt("meeting-system/scenario-context/client-pitch");
      return prompt.text;
    },

    virtualTeam: async () => {
      const prompt = await langfuseService.getPrompt("meeting-system/scenario-context/virtual-team");
      return prompt.text;
    },

    professionalDevelopment: async () => {
      const prompt = await langfuseService.getPrompt("meeting-system/scenario-context/professional-development");
      return prompt.text;
    }
  }
} as const;

// ============================================================================
// SECTION 3: LEGACY MAPPING - Backward compatibility for existing code
// ============================================================================

export const legacyMapping = {
  // Person Detection
  'personDetection.analysis': 'prompts.preMeeting.personDetection.analyzeRequest',
  'prompts.personDetection.analyzeRequest': 'prompts.preMeeting.personDetection.analyzeRequest',

  // Document Processing
  'documentProcessing.analysisPrompt': 'prompts.preMeeting.documentProcessing.analysisPrompt',
  'prompts.documentProcessing.analysisPrompt': 'prompts.preMeeting.documentProcessing.analysisPrompt',
  'documentIntelligence.analysisPrompt': 'prompts.preMeeting.documentProcessing.intelligenceAnalysis',
  'documentIntelligence.queryAnalysis': 'prompts.preMeeting.documentProcessing.queryAnalysis',
  'prompts.documentIntelligence.analysisPrompt': 'prompts.preMeeting.documentProcessing.intelligenceAnalysis',
  'prompts.documentIntelligence.queryAnalysis': 'prompts.preMeeting.documentProcessing.queryAnalysis',

  // Vision Analysis
  'visionAnalysis.screenshotAnalysis': 'prompts.duringMeeting.realTimeAnalysis.visionAnalysis.screenshotAnalysis',
  'prompts.visionAnalysis.screenshotAnalysis': 'prompts.duringMeeting.realTimeAnalysis.visionAnalysis.screenshotAnalysis',

  // Agent Context System
  'agentContextSystem.conversationSummary': 'prompts.duringMeeting.contextManagement.conversationSummary',
  'prompts.agentContextSystem.conversationSummary': 'prompts.duringMeeting.contextManagement.conversationSummary',

  // Conversation Utils
  'conversationUtils.buildSystemPrompt': 'prompts.duringMeeting.communicationUtils.buildSystemPrompt',
  'prompts.conversationUtils.buildSystemPrompt': 'prompts.duringMeeting.communicationUtils.buildSystemPrompt',

  // Meeting Generation
  'meetingGeneration.extractOpportunity': 'prompts.preMeeting.meetingGeneration.extractOpportunity',
  'meetingGeneration.enhancedMeetingDescription': 'prompts.preMeeting.meetingGeneration.enhancedMeetingDescription',
  'meetingGeneration.userDescription': 'prompts.preMeeting.meetingGeneration.userDescription',
  'meetingGeneration.titleGeneration': 'prompts.preMeeting.meetingGeneration.titleGeneration',
  'prompts.meetingGeneration.extractOpportunity': 'prompts.preMeeting.meetingGeneration.extractOpportunity',
  'prompts.meetingGeneration.enhancedMeetingDescription': 'prompts.preMeeting.meetingGeneration.enhancedMeetingDescription',
  'prompts.meetingGeneration.userDescription': 'prompts.preMeeting.meetingGeneration.userDescription',
  'prompts.meetingGeneration.titleGeneration': 'prompts.preMeeting.meetingGeneration.titleGeneration',

  // In-Meeting Messages
  'inMeetingMessages.chainOfThought': 'prompts.duringMeeting.conversationFlow.chainOfThought',
  'inMeetingMessages.responseInstructions': 'prompts.duringMeeting.conversationFlow.responseInstructions',
  'inMeetingMessages.structuredResponseFormat': 'prompts.duringMeeting.conversationFlow.structuredResponseFormat',
  'inMeetingMessages.layerCombination': 'prompts.duringMeeting.conversationFlow.layerCombination',
  'inMeetingMessages.finalInstructions': 'prompts.duringMeeting.conversationFlow.finalInstructions',
  'inMeetingMessages.conversationSummary': 'prompts.duringMeeting.contextManagement.meetingSummary',
  'inMeetingMessages.fallbackConversationSummary': 'prompts.duringMeeting.contextManagement.fallbackConversationSummary',
  'prompts.inMeetingMessages.chainOfThought': 'prompts.duringMeeting.conversationFlow.chainOfThought',
  'prompts.inMeetingMessages.responseInstructions': 'prompts.duringMeeting.conversationFlow.responseInstructions',
  'prompts.inMeetingMessages.structuredResponseFormat': 'prompts.duringMeeting.conversationFlow.structuredResponseFormat',
  'prompts.inMeetingMessages.layerCombination': 'prompts.duringMeeting.conversationFlow.layerCombination',
  'prompts.inMeetingMessages.finalInstructions': 'prompts.duringMeeting.conversationFlow.finalInstructions',

  // Screen Analysis
  'screenAnalysis.contextTemplate': 'prompts.duringMeeting.realTimeAnalysis.screenAnalysis.contextTemplate',
  'screenAnalysis.fallbackContext': 'prompts.duringMeeting.realTimeAnalysis.screenAnalysis.fallbackContext',
  'prompts.screenAnalysis.contextTemplate': 'prompts.duringMeeting.realTimeAnalysis.screenAnalysis.contextTemplate',
  'prompts.screenAnalysis.fallbackContext': 'prompts.duringMeeting.realTimeAnalysis.screenAnalysis.fallbackContext',

  // End of Meeting
  'endOfMeeting.comprehensiveSummary': 'prompts.postMeeting.summaryGeneration.comprehensiveSummary',
  'prompts.endOfMeeting.comprehensiveSummary': 'prompts.postMeeting.summaryGeneration.comprehensiveSummary',

  // Agent Generation
  'agentGeneration.personSpecific': 'prompts.preMeeting.agentGeneration.personSpecific',
  'agentGeneration.personalWorkplace': 'prompts.preMeeting.agentGeneration.personalWorkplace',
  'agentGeneration.workplace': 'prompts.preMeeting.agentGeneration.workplace',
  'agentGeneration.expert': 'prompts.preMeeting.agentGeneration.expert',
  'agentGeneration.complementaryWorkplace': 'prompts.preMeeting.agentGeneration.complementaryWorkplace',
  'agentGeneration.complementaryExpert': 'prompts.preMeeting.agentGeneration.complementaryExpert',
  'prompts.meetingGeneration.agentGeneration.personSpecific': 'prompts.preMeeting.agentGeneration.personSpecific',
  'prompts.meetingGeneration.agentGeneration.personalWorkplace': 'prompts.preMeeting.agentGeneration.personalWorkplace',
  'prompts.meetingGeneration.agentGeneration.workplace': 'prompts.preMeeting.agentGeneration.workplace',
  'prompts.meetingGeneration.agentGeneration.expert': 'prompts.preMeeting.agentGeneration.expert',
  'prompts.meetingGeneration.agentGeneration.complementaryWorkplace': 'prompts.preMeeting.agentGeneration.complementaryWorkplace',
  'prompts.meetingGeneration.agentGeneration.complementaryExpert': 'prompts.preMeeting.agentGeneration.complementaryExpert',

  // Agent Lifecycle
  'agentLifecycle.agentIntroduction.contextual': 'prompts.preMeeting.agentGeneration.introduction.contextual',
  'agentLifecycle.agentIntroduction.fallback': 'prompts.preMeeting.agentGeneration.introduction.fallback',
  'agentLifecycle.agentEnhancement.systemPrompt': 'prompts.preMeeting.agentGeneration.enhancement.systemPrompt',
  'agentLifecycle.customAgent.roleDetection': 'prompts.preMeeting.agentGeneration.customAgent.roleDetection',
  'prompts.agentLifecycle.agentIntroduction.contextual': 'prompts.preMeeting.agentGeneration.introduction.contextual',
  'prompts.agentLifecycle.agentIntroduction.fallback': 'prompts.preMeeting.agentGeneration.introduction.fallback',
  'prompts.agentLifecycle.agentEnhancement.systemPrompt': 'prompts.preMeeting.agentGeneration.enhancement.systemPrompt',
  'prompts.agentLifecycle.customAgent.roleDetection': 'prompts.preMeeting.agentGeneration.customAgent.roleDetection',

  // Agent Introduction
  'agentIntroduction.contextual': 'prompts.preMeeting.agentGeneration.introduction.contextual',
  'agentIntroduction.fallback': 'prompts.preMeeting.agentGeneration.introduction.fallback',
  'agentIntroduction.contextualPrompt': 'prompts.preMeeting.agentGeneration.introduction.contextual',
  'agentIntroduction.fallbackPrompt': 'prompts.preMeeting.agentGeneration.introduction.fallback',
  'prompts.agentIntroduction.contextualPrompt': 'prompts.preMeeting.agentGeneration.introduction.contextual',
  'prompts.agentIntroduction.fallbackPrompt': 'prompts.preMeeting.agentGeneration.introduction.fallback',

  // Client Opportunity Analysis
  'clientOpportunityAnalysis.extractOpportunity': 'prompts.preMeeting.clientOpportunityAnalysis.extractOpportunity',
  'clientOpportunityAnalysis.enhancedMeetingDescription': 'prompts.preMeeting.clientOpportunityAnalysis.enhancedMeetingDescription',
  'clientOpportunityAnalysis.userDescription': 'prompts.preMeeting.clientOpportunityAnalysis.userDescription',
  'prompts.clientOpportunityAnalysis.extractOpportunity': 'prompts.preMeeting.clientOpportunityAnalysis.extractOpportunity',
  'prompts.clientOpportunityAnalysis.enhancedMeetingDescription': 'prompts.preMeeting.clientOpportunityAnalysis.enhancedMeetingDescription',
  'prompts.clientOpportunityAnalysis.userDescription': 'prompts.preMeeting.clientOpportunityAnalysis.userDescription',

  // Meeting Title Generator
  'meetingTitleGenerator.generateTitle': 'prompts.preMeeting.meetingGeneration.titleGeneration',
  'meetingTitleGenerator.generatePrompt': 'prompts.preMeeting.meetingGeneration.titleGeneration',
  'prompts.meetingTitleGenerator.generatePrompt': 'prompts.preMeeting.meetingGeneration.titleGeneration',
  'prompts.meetingGenerationAdditional.meetingTitleGenerator.generateTitle': 'prompts.preMeeting.meetingGeneration.titleGeneration',

  // Scenario Generation
  'scenarioGeneration.enhancedTopic': 'prompts.preMeeting.meetingGeneration.scenarioGeneration.enhancedTopic',
  'scenarioGeneration.documentContext': 'prompts.preMeeting.meetingGeneration.scenarioGeneration.documentContext',
  'scenarioGeneration.basePromptBuilder': 'prompts.preMeeting.meetingGeneration.scenarioGeneration.basePromptBuilder',
  'prompts.scenarioGeneration.basePromptBuilder': 'prompts.preMeeting.meetingGeneration.scenarioGeneration.basePromptBuilder',
  'prompts.meetingGenerationAdditional.scenarioGeneration.enhancedTopic': 'prompts.preMeeting.meetingGeneration.scenarioGeneration.enhancedTopic',
  'prompts.meetingGenerationAdditional.scenarioGeneration.documentContext': 'prompts.preMeeting.meetingGeneration.scenarioGeneration.documentContext',

  // Scenario Templates
  'scenarioTemplate.clientPitchContext': 'prompts.preMeeting.meetingGeneration.scenarioTemplates.clientPitchContext',
  'scenarioTemplate.virtualTeamContext': 'prompts.preMeeting.meetingGeneration.scenarioTemplates.virtualTeamContext',
  'scenarioTemplate.professionalDevContext': 'prompts.preMeeting.meetingGeneration.scenarioTemplates.professionalDevContext',
  'prompts.scenarioTemplate.clientPitchContext': 'prompts.preMeeting.meetingGeneration.scenarioTemplates.clientPitchContext',
  'prompts.scenarioTemplate.virtualTeamContext': 'prompts.preMeeting.meetingGeneration.scenarioTemplates.virtualTeamContext',
  'prompts.scenarioTemplate.professionalDevContext': 'prompts.preMeeting.meetingGeneration.scenarioTemplates.professionalDevContext',

  // Communication Context
  'agentContext.conversationSummary': 'prompts.duringMeeting.contextManagement.agentContextSummary',
  'communicationContext.agentContext.conversationSummary': 'prompts.duringMeeting.contextManagement.agentContextSummary',
  'prompts.communicationContext.agentContext.conversationSummary': 'prompts.duringMeeting.contextManagement.agentContextSummary',

  // Gemini System
  'geminiSystem.base': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.base',
  'geminiSystem.blufStyle': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.blufStyle',
  'geminiSystem.newContext': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.newContext',
  'geminiSystem.modelUnderstanding': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.modelUnderstanding',
  'prompts.communicationContext.geminiSystem.base': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.base',
  'prompts.communicationContext.geminiSystem.blufStyle': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.blufStyle',
  'prompts.communicationContext.geminiSystem.newContext': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.newContext',
  'prompts.communicationContext.geminiSystem.modelUnderstanding': 'prompts.duringMeeting.communicationUtils.geminiSystemPrompts.modelUnderstanding',

  // OpenAI Vision
  'openAIVision.screenshotAnalysis': 'prompts.duringMeeting.realTimeAnalysis.visionAnalysis.openAIVisionAnalysis',
  'prompts.communicationContext.openAIVision.screenshotAnalysis': 'prompts.duringMeeting.realTimeAnalysis.visionAnalysis.openAIVisionAnalysis',

  // Custom Agent
  'customAgent.roleIdentificationPrompt': 'prompts.preMeeting.agentGeneration.customAgent.roleIdentificationPrompt',
  'customAgent.systemPrompt': 'prompts.preMeeting.agentGeneration.customAgent.systemPrompt',
  'prompts.customAgent.roleIdentificationPrompt': 'prompts.preMeeting.agentGeneration.customAgent.roleIdentificationPrompt',
  'prompts.customAgent.systemPrompt': 'prompts.preMeeting.agentGeneration.customAgent.systemPrompt',

  // Meeting Summary
  'meetingSummary.comprehensiveAnalysis': 'prompts.postMeeting.analysisReporting.comprehensiveAnalysis',
  'meetingSummary.analysisPrompt': 'prompts.postMeeting.analysisReporting.analysisPrompt',
  'prompts.meetingSummary.comprehensiveAnalysis': 'prompts.postMeeting.analysisReporting.comprehensiveAnalysis',

  // Scenario Context
  'scenarioContext.clientPitch': 'prompts.scenarioContext.clientPitch',
  'scenarioContext.virtualTeam': 'prompts.scenarioContext.virtualTeam',
  'scenarioContext.professionalDevelopment': 'prompts.scenarioContext.professionalDevelopment',
  'prompts.scenarioContext.clientPitch': 'prompts.scenarioContext.clientPitch',
  'prompts.scenarioContext.virtualTeam': 'prompts.scenarioContext.virtualTeam',
  'prompts.scenarioContext.professionalDevelopment': 'prompts.scenarioContext.professionalDevelopment',

  // Agent prompts
  'agent.chainOfThought': 'prompts.duringMeeting.conversationFlow.chainOfThought',
  'agent.responseInstructions': 'prompts.duringMeeting.conversationFlow.responseInstructions',
  'agent.enhancement': 'agentEnhancement',

  // Meeting prompts
  'meeting.comprehensiveSummary': 'prompts.postMeeting.summaryGeneration.comprehensiveSummary',
  'meeting.titleGeneration': 'prompts.preMeeting.meetingGeneration.titleGeneration',
  'meeting.conversationSummary': 'prompts.duringMeeting.contextManagement.meetingSummary',

  // Pitch prompts
  'pitch.extractOpportunity': 'prompts.preMeeting.meetingGeneration.extractOpportunity',
  'pitch.enhancedMeetingDescription': 'prompts.preMeeting.meetingGeneration.enhancedMeetingDescription',
  'pitch.userDescription': 'prompts.preMeeting.meetingGeneration.userDescription',

  // Expert types (already correct, just mapping for consistency)
  'expertTypes.bigPicture': 'expertTypes.bigPicture',
  'expertTypes.practical': 'expertTypes.practical',
  'expertTypes.creative': 'expertTypes.creative',

  // Unified Agent Service prompts
  'unifiedAgent.structuredResponseFormat': 'prompts.duringMeeting.conversationFlow.structuredResponseFormat',
  'unifiedAgent.layerCombination': 'prompts.duringMeeting.conversationFlow.layerCombination',
  'unifiedAgent.fallbackConversationSummary': 'prompts.duringMeeting.contextManagement.fallbackConversationSummary',
  'unifiedAgent.finalInstructions': 'prompts.duringMeeting.conversationFlow.finalInstructions',

  // Unified Pitch Processing prompts
  'pitch.processPitchInput': 'prompts.preMeeting.unifiedPitchProcessing.processPitchInput',
  'pitch.generateMeetingAgents': 'prompts.preMeeting.unifiedPitchProcessing.generateMeetingAgents',
  'unifiedPitch.processInput': 'prompts.preMeeting.unifiedPitchProcessing.processPitchInput',
  'unifiedPitch.generateAgents': 'prompts.preMeeting.unifiedPitchProcessing.generateMeetingAgents'
} as const;