
import { Message } from '../../../../shared/types/chat';
import { Agent } from '../../../../shared/types/agent';

interface ConversationDynamics {
  participationLevel: 'high' | 'medium' | 'low';
  lastContributionTurn: number;
  responseQuality: 'excellent' | 'good' | 'needs_improvement';
  topicAlignment: number; // 0-1 scale
  relationshipAlignment: number; // 0-1 scale
}

interface AgentAdaptation {
  shouldBeMoreActive: boolean;
  shouldChangeApproach: boolean;
  suggestedFocus: string[];
  confidenceBoost: boolean;
}

export class DynamicContextService {
  private static conversationDynamics = new Map<string, ConversationDynamics>();
  
  static analyzeAgentPerformance(
    agentId: string, 
    messages: Message[], 
    agent: Agent
  ): ConversationDynamics {
    const agentMessages = messages.filter(m => m.sender === agentId && !m.isUser);
    const totalTurns = messages.length;
    const agentTurns = agentMessages.length;
    
    // Calculate participation level
    const participationRatio = totalTurns > 0 ? agentTurns / totalTurns : 0;
    const participationLevel = participationRatio > 0.4 ? 'high' : 
                              participationRatio > 0.2 ? 'medium' : 'low';
    
    // Find last contribution
    const lastMessage = agentMessages[agentMessages.length - 1];
    const lastContributionTurn = lastMessage?.speakerTurn || 0;
    
    // Assess topic alignment based on agent's expertise
    const topicAlignment = this.assessTopicAlignment(agentMessages, agent);
    const relationshipAlignment = this.assessRelationshipAlignment(agentMessages, agent);
    
    const dynamics: ConversationDynamics = {
      participationLevel,
      lastContributionTurn,
      responseQuality: this.assessResponseQuality(agentMessages),
      topicAlignment,
      relationshipAlignment
    };
    
    this.conversationDynamics.set(agentId, dynamics);
    return dynamics;
  }
  
  static generateAdaptationStrategy(
    agentId: string,
    dynamics: ConversationDynamics,
    currentTurn: number
  ): AgentAdaptation {
    const turnsSinceLastContribution = currentTurn - dynamics.lastContributionTurn;
    
    return {
      shouldBeMoreActive: dynamics.participationLevel === 'low' && turnsSinceLastContribution > 3,
      shouldChangeApproach: dynamics.responseQuality === 'needs_improvement' || dynamics.topicAlignment < 0.6,
      suggestedFocus: this.generateFocusAreas(dynamics),
      confidenceBoost: dynamics.relationshipAlignment > 0.8 && dynamics.participationLevel === 'low'
    };
  }
  
  static buildDynamicPromptAddition(
    agent: Agent,
    dynamics: ConversationDynamics,
    adaptation: AgentAdaptation,
    currentTurn: number
  ): string {
    let promptAddition = '';
    
    // Relationship-specific guidance
    if (agent.relationshipToUser) {
      promptAddition += `\n\nRELATIONSHIP CONTEXT: You are ${agent.relationshipToUser}. `;
      
      if (agent.relationshipToUser.includes('manager') || agent.relationshipToUser.includes('boss')) {
        promptAddition += 'You have decision-making authority and should provide clear direction when appropriate. ';
      } else if (agent.relationshipToUser.includes('peer') || agent.relationshipToUser.includes('colleague')) {
        promptAddition += 'You work at the same level and can offer collaborative insights and shared experiences. ';
      } else if (agent.relationshipToUser.includes('accountant') || agent.relationshipToUser.includes('lawyer')) {
        promptAddition += 'You are their professional service provider and should focus on your area of expertise. ';
      }
    }
    
    // Dynamic adaptations
    if (adaptation.shouldBeMoreActive) {
      promptAddition += 'You haven\'t contributed much recently - be more proactive and share your unique perspective. ';
    }
    
    if (adaptation.shouldChangeApproach && dynamics.topicAlignment < 0.6) {
      promptAddition += 'Refocus on your core expertise and how it specifically applies to this discussion. ';
    }
    
    if (adaptation.confidenceBoost) {
      promptAddition += 'Your insights are valuable - speak with confidence about your area of expertise. ';
    }
    
    // Expertise-specific guidance
    if (agent.expertise) {
      promptAddition += `\n\nEXPERTISE FOCUS: Your specialty is ${agent.expertise}. `;
      
      if (adaptation.suggestedFocus.length > 0) {
        promptAddition += `Focus particularly on: ${adaptation.suggestedFocus.join(', ')}. `;
      }
    }
    
    return promptAddition;
  }
  
  private static assessTopicAlignment(messages: Message[], agent: Agent): number {
    if (!agent.expertise || messages.length === 0) return 0.5;
    
    const expertiseKeywords = agent.expertise.toLowerCase().split(/[\s,]+/);
    let alignmentScore = 0;
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      const matchingKeywords = expertiseKeywords.filter(keyword => 
        content.includes(keyword)
      );
      alignmentScore += matchingKeywords.length / expertiseKeywords.length;
    });
    
    return Math.min(alignmentScore / messages.length, 1);
  }
  
  private static assessRelationshipAlignment(messages: Message[], agent: Agent): number {
    if (!agent.relationshipToUser || messages.length === 0) return 0.5;
    
    // Check if agent is using appropriate relationship language
    let relationshipScore = 0;
    const relationshipKeywords = ['you', 'your', 'we', 'our', 'together'];
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      const hasRelationshipLanguage = relationshipKeywords.some(keyword => 
        content.includes(keyword)
      );
      if (hasRelationshipLanguage) relationshipScore += 1;
    });
    
    return Math.min(relationshipScore / messages.length, 1);
  }
  
  private static assessResponseQuality(messages: Message[]): 'excellent' | 'good' | 'needs_improvement' {
    if (messages.length === 0) return 'good';
    
    const avgLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;
    const hasQuestions = messages.some(msg => msg.content.includes('?'));
    const hasSpecificAdvice = messages.some(msg => 
      msg.content.includes('suggest') || msg.content.includes('recommend') || msg.content.includes('should')
    );
    
    if (avgLength > 150 && hasQuestions && hasSpecificAdvice) return 'excellent';
    if (avgLength > 80 && (hasQuestions || hasSpecificAdvice)) return 'good';
    return 'needs_improvement';
  }
  
  private static generateFocusAreas(dynamics: ConversationDynamics): string[] {
    const areas: string[] = [];
    
    if (dynamics.topicAlignment < 0.6) {
      areas.push('your core expertise');
    }
    
    if (dynamics.relationshipAlignment < 0.6) {
      areas.push('your relationship with the user');
    }
    
    if (dynamics.participationLevel === 'low') {
      areas.push('proactive contributions');
    }
    
    return areas;
  }
  
  static clearConversationData(conversationId: string) {
    // Clear conversation-specific data when meeting ends
    this.conversationDynamics.clear();
  }
}
