import { generateText } from 'ai';
import { extract } from 'langextract';

import type { DocumentProcessingResult, ExtractedEntity } from '@/types/document';

import { AI_MODELS } from './ai';

/**
 * Document processor - modular AI processing using existing infrastructure
 */
export class DocumentProcessor {
  private readonly model = AI_MODELS.TEXT.GPT_4O_MINI; // Cost-effective model

  /**
   * Extract structured entities from document content
   */
  async extractEntities(content: string, filename: string): Promise<ExtractedEntity[]> {
    try {
      // Truncate content for API limits
      const truncatedContent = content.length > 8000 ? content.substring(0, 8000) + '...' : content;

      const result = await extract(truncatedContent, {
        promptDescription: 'Extract key entities and information from this document',
        examples: [], // Let langextract use its default examples for flexibility
        modelType: 'openai',
        apiKey: process.env.REACT_APP_OPENAI_API_KEY!,
        modelId: 'gpt-4o-mini',
      });

      console.log(`Extracted ${result.extractions.length} entities from ${filename}`);
      return result.extractions;
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  /**
   * Generate document summary using centralized AI models
   */
  async generateSummary(content: string, filename: string): Promise<string> {
    const truncatedContent = content.length > 10000 ? content.substring(0, 10000) + '...' : content;

    const prompt = `Analyze this document titled "${filename}" and provide a concise summary focusing on key topics and important information:

${truncatedContent}

Provide a clear, concise summary in 2-3 sentences.`;

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
      });
      return text.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return `Document: ${filename}`;
    }
  }

  /**
   * Extract key points from document
   */
  async extractKeyPoints(content: string, filename: string): Promise<string[]> {
    const truncatedContent = content.length > 10000 ? content.substring(0, 10000) + '...' : content;

    const prompt = `Extract 5 key points from this document titled "${filename}". Format as simple lines without bullets:

${truncatedContent}

Return only the key points, one per line.`;

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
      });

      return text
        .split('\n')
        .map((point) => point.trim())
        .filter((point) => point.length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Error extracting key points:', error);
      return ['Document content available for reference'];
    }
  }

  /**
   * Process document with full AI analysis
   */
  async processDocument(
    content: string,
    filename: string,
    enableEntityExtraction = true,
  ): Promise<DocumentProcessingResult> {
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'Document appears to be empty or could not be read properly',
      };
    }

    try {
      const [summary, keyPoints, extractedData] = await Promise.all([
        this.generateSummary(content, filename),
        this.extractKeyPoints(content, filename),
        enableEntityExtraction ? this.extractEntities(content, filename) : Promise.resolve([]),
      ]);

      return {
        success: true,
        content,
        summary,
        keyPoints,
        extractedData,
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        content,
        error: error instanceof Error ? error.message : 'Unknown processing error',
      };
    }
  }

  /**
   * Generate meeting context from processed documents
   */
  generateMeetingContext(
    documents: Array<{
      filename: string;
      summary: string;
      keyPoints?: string[];
      extractedData?: ExtractedEntity[];
    }>,
  ): string {
    if (documents.length === 0) return '';

    let context = '\n\n╔══════════════════════════════════════╗\n';
    context += '║         DOCUMENT LIBRARY             ║\n';
    context += '╚══════════════════════════════════════╝\n';
    context += '\nReference documents for this meeting:\n\n';

    documents.forEach((doc, index) => {
      context += `📄 ${index + 1}. ${doc.filename}\n`;
      context += `   Summary: ${doc.summary}\n`;

      if (doc.keyPoints && doc.keyPoints.length > 0) {
        context += `   Key Points: ${doc.keyPoints.join(', ')}\n`;
      }

      if (doc.extractedData && doc.extractedData.length > 0) {
        const entities = doc.extractedData
          .slice(0, 3)
          .map((e) => `${e.extractionClass}: ${e.extractionText}`)
          .join(', ');
        context += `   Entities: ${entities}\n`;
      }

      context += '\n';
    });

    return context;
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();
