
import { Agent } from '../../../../shared/types/agent';
import { AgentConfig } from '../../config/agentConfig';

export class FallbackAgentService {
  static getDefaultExpertSuggestions(): Agent[] {
    return AgentConfig.convertTemplatesToAgents(AgentConfig.DEFAULT_EXPERTS);
  }

  static getRoleBasedFallback(topic: string, userRole: string): Agent[] {
    const lowerRole = userRole.toLowerCase();
    
    // Startup founder specific experts
    if (lowerRole.includes('founder') || lowerRole.includes('startup') || lowerRole.includes('entrepreneur')) {
      return AgentConfig.convertTemplatesToAgents(AgentConfig.STARTUP_EXPERTS);
    }
    
    // Product manager specific experts
    if (lowerRole.includes('product') && (lowerRole.includes('manager') || lowerRole.includes('lead'))) {
      return AgentConfig.convertTemplatesToAgents(AgentConfig.PRODUCT_MANAGER_EXPERTS);
    }
    
    // Marketing role specific experts
    if (lowerRole.includes('marketing') || lowerRole.includes('growth')) {
      return AgentConfig.convertTemplatesToAgents(AgentConfig.MARKETING_EXPERTS);
    }
    
    // Default fallback for any other role
    return this.getTopicBasedFallback(topic);
  }

  static getTopicBasedFallback(topic: string): Agent[] {
    const lowerTopic = topic.toLowerCase();
    
    // Marketing/Sales topics
    if (lowerTopic.includes('marketing') || lowerTopic.includes('sales') || lowerTopic.includes('brand')) {
      const marketingTemplates = [
        {
          name: "Sarah Chen",
          role: "Big-picture Marketing Strategy Director",
          expertise: "Digital marketing and brand positioning",
          description: "Marketing strategist with expertise in brand development, digital campaigns, and customer acquisition strategies."
        },
        {
          name: "David Thompson",
          role: "Practical / step-by-step Sales Operations Manager",
          expertise: "Sales processes and customer relations",
          description: "Sales expert focused on pipeline optimization, customer relationship management, and revenue growth strategies."
        },
        {
          name: "Maya Patel",
          role: "Creative Problem Solver & Brand Designer",
          expertise: "Visual design and brand storytelling",
          description: "Creative director specializing in brand identity, visual storytelling, and creating compelling marketing assets."
        }
      ];
      return AgentConfig.convertTemplatesToAgents(marketingTemplates);
    }
    
    // Product/Technology topics
    if (lowerTopic.includes('product') || lowerTopic.includes('tech') || lowerTopic.includes('software') || lowerTopic.includes('app')) {
      const techTemplates = [
        {
          name: "Alex Rivera",
          role: "Big-picture Product Manager",
          expertise: "Product strategy and user experience",
          description: "Senior product manager with expertise in user research, product roadmaps, and agile development processes."
        },
        {
          name: "Dr. Emily Wong",
          role: "Practical / step-by-step Technical Architect",
          expertise: "Software architecture and engineering",
          description: "Technical lead with deep expertise in system design, scalable architecture, and engineering best practices."
        },
        {
          name: "James Foster",
          role: "Creative Problem Solver & UX Research Director",
          expertise: "User experience and design thinking",
          description: "UX researcher focused on user-centered design, usability testing, and creating intuitive digital experiences."
        }
      ];
      return AgentConfig.convertTemplatesToAgents(techTemplates);
    }
    
    // Financial topics
    if (lowerTopic.includes('finance') || lowerTopic.includes('budget') || lowerTopic.includes('investment') || lowerTopic.includes('money')) {
      const financeTemplates = [
        {
          name: "Robert Kim",
          role: "Big-picture Financial Advisor",
          expertise: "Financial planning and investment strategy",
          description: "Certified financial planner with expertise in investment strategies, risk management, and financial goal planning."
        },
        {
          name: "Lisa Zhang",
          role: "Practical / step-by-step Risk Analysis Specialist",
          expertise: "Risk assessment and mitigation",
          description: "Risk management expert specializing in financial risk analysis, compliance, and strategic risk mitigation."
        },
        {
          name: "Carlos Mendez",
          role: "Creative Problem Solver & Business Finance Manager",
          expertise: "Corporate finance and budgeting",
          description: "Finance manager with expertise in budgeting, cash flow management, and business financial strategy."
        }
      ];
      return AgentConfig.convertTemplatesToAgents(financeTemplates);
    }
    
    // Default fallback for any other topic
    return this.getDefaultExpertSuggestions();
  }
}
