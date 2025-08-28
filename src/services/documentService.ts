import { documentProcessor } from '@/lib/documentProcessor';
import type {
  DocumentUploadOptions,
  DocumentValidationResult,
  MeetingDocument,
} from '@/types/document';

/**
 * Document service - follows passwordService pattern for consistency
 */
class DocumentService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  /**
   * Validate uploaded file
   */
  validateFile(file: File): DocumentValidationResult {
    const warnings: string[] = [];

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 10MB`,
      };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not supported. Please use PDF, TXT, or MD files.`,
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      warnings.push('Large files may take longer to process');
    }

    return { isValid: true, warnings };
  }

  /**
   * Extract text from different file types
   */
  async extractTextFromFile(file: File): Promise<string> {
    try {
      if (file.type === 'application/pdf') {
        // PDF processing using pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: unknown) => {
              if (typeof item === 'object' && item !== null && 'str' in item) {
                const strItem = item as { str: unknown };
                return typeof strItem.str === 'string' ? strItem.str : '';
              }
              return '';
            })
            .filter((str) => str.length > 0)
            .join(' ');
          fullText += pageText + '\n';
        }

        return fullText.trim();
      }

      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        return await file.text();
      }

      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For now, reject Word docs - can add docx parsing later
        throw new Error('Word documents not yet supported. Please convert to PDF or text format.');
      }

      throw new Error(`Unsupported file type: ${file.type}`);
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to extract text from file');
    }
  }

  /**
   * Process uploaded document - main service method
   */
  async processDocument(
    file: File,
    options: DocumentUploadOptions = {},
  ): Promise<{ success: boolean; document?: MeetingDocument; error?: string }> {
    try {
      // Validate file first
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Extract text content
      const content = await this.extractTextFromFile(file);

      if (!content || content.trim().length === 0) {
        return { success: false, error: 'Document appears to be empty' };
      }

      // Process with AI
      const processed = await documentProcessor.processDocument(
        content,
        file.name,
        options.enableEntityExtraction ?? true,
      );

      if (!processed.success) {
        return { success: false, error: processed.error };
      }

      // Create document object
      const document: MeetingDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        content: processed.content!,
        summary: processed.summary,
        keyPoints: processed.keyPoints,
        extractedData: processed.extractedData,
        uploadTimestamp: Date.now(),
        processingStatus: 'completed',
      };

      return { success: true, document };
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during processing',
      };
    }
  }

  /**
   * Generate meeting context from documents
   */
  generateMeetingContext(documents: MeetingDocument[]): string {
    // Filter out documents without summaries and ensure proper typing
    const validDocuments = documents
      .filter((doc) => doc.summary)
      .map((doc) => ({
        filename: doc.filename,
        summary: doc.summary!,
        keyPoints: doc.keyPoints,
        extractedData: doc.extractedData,
      }));

    return documentProcessor.generateMeetingContext(validDocuments);
  }

  /**
   * Get supported file types for UI
   */
  getSupportedTypes(): string[] {
    return this.ALLOWED_TYPES;
  }

  /**
   * Get max file size for UI
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }
}

// Export singleton instance following passwordService pattern
export const documentService = new DocumentService();
