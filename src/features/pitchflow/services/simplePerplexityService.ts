import { supabase } from "@/integrations/supabase/client";
import { PERPLEXITY_RESEARCH_ENABLED } from "@/constants/app";

export class SimplePerplexityService {
  async performResearch(query: string): Promise<string> {
    if (!PERPLEXITY_RESEARCH_ENABLED) {
      return "Research feature is currently disabled";
    }

    if (!query?.trim()) {
      return "No research query provided";
    }

    try {
      console.log('[SIMPLE PERPLEXITY] Starting research for query:', query);
      
      const { data, error } = await supabase.functions.invoke('perplexity-research', {
        body: {
          query: query.trim(),
          maxResults: 3
        }
      });

      if (error) {
        console.error('[SIMPLE PERPLEXITY] Supabase function error:', error);
        return `Research unavailable: ${error.message || 'Service error'}`;
      }

      if (!data?.success) {
        console.error('[SIMPLE PERPLEXITY] Research failed:', data?.error);
        return `Research failed: ${data?.error || 'Unknown error'}`;
      }

      if (!data?.research) {
        console.log('[SIMPLE PERPLEXITY] No research data returned');
        return "No research results found for this query";
      }

      // Extract content from the research response
      const research = data.research;
      let content = '';

      if (research.summary) {
        content += research.summary.trim() + ' ';
      }

      if (research.sources?.length > 0) {
        research.sources.forEach((source: any) => {
          if (source.snippet) {
            content += source.snippet.trim() + ' ';
          } else if (source.content) {
            content += source.content.trim() + ' ';
          }
        });
      }

      content = content.trim();

      if (!content) {
        content = "Research completed but no detailed insights were found";
      }

      console.log('[SIMPLE PERPLEXITY] Research completed successfully, content length:', content.length);
      return content.trim();

    } catch (error) {
      console.error('[SIMPLE PERPLEXITY] Service error:', error);
      return `Research service error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export const simplePerplexityService = new SimplePerplexityService();