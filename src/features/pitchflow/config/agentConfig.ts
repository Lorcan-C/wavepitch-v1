import { Agent } from '../../../shared/types/agent';

interface AgentTemplate {
  name: string;
  role: string;
  expertise: string;
  description: string;
}

export class AgentConfig {
  static readonly DEFAULT_EXPERTS: AgentTemplate[] = [
    {
      name: "Michael Johnson",
      role: "Big-picture Strategy Director",
      expertise: "Strategic planning and business development",
      description: "Senior strategist with expertise in long-term planning, market analysis, and business growth strategies."
    },
    {
      name: "Sarah Williams",
      role: "Practical / step-by-step Operations Manager", 
      expertise: "Process optimization and project management",
      description: "Operations expert focused on efficient processes, project execution, and tactical implementation."
    },
    {
      name: "Dr. James Chen",
      role: "Creative Problem Solver & Innovation Lead",
      expertise: "Creative thinking and innovative solutions",
      description: "Innovation specialist with a track record of creative problem-solving and breakthrough thinking."
    }
  ];

  static readonly STARTUP_EXPERTS: AgentTemplate[] = [
    {
      name: "Jessica Martinez",
      role: "Big-picture Startup Advisor",
      expertise: "Startup strategy and venture development",
      description: "Experienced entrepreneur and startup advisor with expertise in business model development, fundraising, and scaling strategies."
    },
    {
      name: "Alex Thompson", 
      role: "Practical / step-by-step Product Development Lead",
      expertise: "MVP development and product-market fit",
      description: "Product development expert specializing in lean startup methodology, MVP creation, and iterative product development."
    },
    {
      name: "Priya Sharma",
      role: "Creative Problem Solver & Growth Marketing Specialist",
      expertise: "Growth hacking and customer acquisition",
      description: "Growth marketing expert with creative approaches to customer acquisition, viral marketing, and startup growth strategies."
    }
  ];

  static readonly PRODUCT_MANAGER_EXPERTS: AgentTemplate[] = [
    {
      name: "David Park",
      role: "Big-picture Product Strategy Director",
      expertise: "Product vision and roadmap planning",
      description: "Senior product strategist with expertise in product vision, market research, and long-term product roadmap development."
    },
    {
      name: "Rachel Kim",
      role: "Practical / step-by-step Agile Development Manager",
      expertise: "Agile methodologies and team coordination",
      description: "Agile expert focused on sprint planning, team coordination, and efficient product development processes."
    },
    {
      name: "Tom Anderson",
      role: "Creative Problem Solver & User Experience Researcher",
      expertise: "User research and design thinking",
      description: "UX researcher specializing in user-centered design, usability testing, and creative solution development."
    }
  ];

  static readonly MARKETING_EXPERTS: AgentTemplate[] = [
    {
      name: "Maria Rodriguez",
      role: "Big-picture Brand Strategy Director",
      expertise: "Brand positioning and marketing strategy",
      description: "Brand strategist with expertise in market positioning, brand development, and comprehensive marketing strategy."
    },
    {
      name: "Kevin Lee",
      role: "Practical / step-by-step Digital Marketing Manager",
      expertise: "Digital campaigns and performance marketing",
      description: "Digital marketing specialist focused on campaign execution, performance optimization, and measurable marketing results."
    },
    {
      name: "Emma Wilson",
      role: "Creative Problem Solver & Content Strategy Lead",
      expertise: "Content creation and creative campaigns",
      description: "Creative marketing expert specializing in content strategy, storytelling, and innovative campaign development."
    }
  ];

  static convertTemplatesToAgents(templates: AgentTemplate[]): Agent[] {
    return templates.map((template, index) => ({
      id: `agent-${Date.now()}-${index}`,
      name: template.name,
      role: template.role,
      description: template.description,
      expertise: template.expertise,
      source: 'prebuilt' as const,
      generationContext: {
        originalTopic: 'fallback',
        contextType: 'general' as const,
        expertType: this.extractExpertType(template.role),
      },
      aiMetadata: {
        generatedAt: new Date().toISOString(),
        generationSuccess: true,
      }
    }));
  }

  private static extractExpertType(role: string): string {
    if (role.includes('Big-picture')) return 'Big-picture';
    if (role.includes('Practical') || role.includes('step-by-step')) return 'Practical';
    if (role.includes('Creative Problem Solver')) return 'Creative';
    return 'General';
  }
}