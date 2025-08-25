import { MeetingDocument, DocumentProcessingResult } from "../../../shared/types/document";
import { getTextGenerationService } from "./textGenerationService";
import { langfuseService } from './langfuseService';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker - use bundled approach to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

class DocumentService {
  private documents: Map<string, MeetingDocument> = new Map();

  // Enhanced text extraction from PDF files with structure preservation
  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = `DOCUMENT: ${file.name}\nTOTAL PAGES: ${pdf.numPages}\nEXTRACTED: ${new Date().toISOString()}\n\n`;
      
      // Extract text from each page with structure preservation
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Reconstruct text with better structure preservation
        const structuredText = this.reconstructTextStructure(textContent);
        fullText += `\n\n=== PAGE ${pageNum} ===\n${structuredText}`;
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Reconstruct text structure for better readability
  private reconstructTextStructure(textContent: any): string {
    const items = textContent.items;
    if (!items || items.length === 0) return '';

    // Group text items by vertical position (rough paragraph detection)
    const lines = this.groupTextByLines(items);
    
    // Reconstruct with preserved spacing and paragraph breaks
    return lines
      .map(line => {
        const text = line.map(item => item.str).join(' ').trim();
        return text;
      })
      .filter(line => line.length > 0)
      .join('\n\n'); // Double newline for paragraph separation
  }

  // Group text items by vertical position to preserve structure
  private groupTextByLines(items: any[]): any[][] {
    const lines: any[][] = [];
    let currentLine: any[] = [];
    let lastY = -1;
    const lineHeight = 12; // Approximate line height threshold

    items.forEach(item => {
      if (item.transform && item.transform.length >= 6) {
        const y = item.transform[5]; // Y position
        
        if (lastY === -1 || Math.abs(y - lastY) < lineHeight) {
          // Same line or first item
          currentLine.push(item);
          lastY = y;
        } else {
          // New line
          if (currentLine.length > 0) {
            lines.push([...currentLine]);
          }
          currentLine = [item];
          lastY = y;
        }
      } else {
        currentLine.push(item);
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  // Extract text from plain text files
  private async extractTextFromTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const enhancedResult = `DOCUMENT: ${file.name}\nTYPE: Plain Text\nEXTRACTED: ${new Date().toISOString()}\n\n${result}`;
        resolve(enhancedResult);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read text file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Extract text content from different file types
  async extractTextFromFile(file: File): Promise<string> {
    try {
      // Determine file type and process accordingly
      if (file.type === 'application/pdf') {
        return await this.extractTextFromPDF(file);
      } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
        return await this.extractTextFromTextFile(file);
      } else if (file.type.includes('document') || file.type.includes('word')) {
        // For Word documents, we'll provide a clear error message
        throw new Error('Word documents (.doc/.docx) are not yet supported. Please convert to PDF or plain text format.');
      } else {
        // For unknown file types, try to read as text but warn the user
        console.warn(`Unsupported file type: ${file.type}. Attempting to read as text.`);
        return await this.extractTextFromTextFile(file);
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error;
    }
  }

  // Get page count from document content
  private getPageCount(content: string): number {
    const pageMatches = content.match(/=== PAGE \d+ ===/g);
    return pageMatches ? pageMatches.length : 1;
  }

  // Process document content using AI - optimized with single call
  async processDocument(content: string, filename: string, userContext?: string): Promise<DocumentProcessingResult> {
    // Validate content before processing
    if (!content || content.trim().length === 0) {
      throw new Error('Document appears to be empty or could not be read properly');
    }

    const aiService = getTextGenerationService();
    
    // Increased content limit for better processing (increased from 12000 to 100000)
    const truncatedContent = content.length > 100000 ? content.substring(0, 100000) + "..." : content;
    
    // Import prompts for consistent template usage
    // Get prompt from Langfuse based on context
    const promptData = userContext 
      ? await langfuseService.getPrompt('document-processing-analysis-with-context')
      : await langfuseService.getPrompt('document-processing-analysis');
    
    const combinedPrompt = promptData.compile({
      filename,
      userContext: userContext || '',
      content: truncatedContent
    });

    try {
      // Create mock agent object for document processing
      const docProcessor = {
        id: "doc-processor",
        name: "Document Processor",
        description: "AI assistant that efficiently processes documents with enhanced document handling capabilities"
      };

      const response = await aiService.generateAgentResponse(combinedPrompt);

      // Parse the response
      const summaryMatch = response.match(/SUMMARY:\s*(.*?)(?=KEY POINTS:|$)/s);
      const keyPointsMatch = response.match(/KEY POINTS:\s*([\s\S]*)/);
      
      const summary = summaryMatch ? summaryMatch[1].trim() : `Document: ${filename}`;
      const keyPoints = keyPointsMatch 
        ? keyPointsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^[-•*]\s*/, '').trim())
            .filter(point => point.length > 0)
            .slice(0, 5)
        : ['Document content available for reference'];

      return {
        content: truncatedContent,
        summary,
        keyPoints
      };
    } catch (error) {
      console.error('Error processing document with AI:', error);
      return {
        content: truncatedContent,
        summary: `Document: ${filename}`,
        keyPoints: ['Document content available for reference']
      };
    }
  }

  // Add a document to the temporary storage
  async addDocument(file: File, userContext?: string): Promise<MeetingDocument> {
    try {
      const content = await this.extractTextFromFile(file);
      const processed = await this.processDocument(content, file.name, userContext);
      
      const document: MeetingDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        content: processed.content,
        summary: processed.summary,
        keyPoints: processed.keyPoints,
        uploadTimestamp: Date.now()
      };

      this.documents.set(document.id, document);
      
      // Store in sessionStorage as backup
      try {
        const storedDocs = JSON.parse(sessionStorage.getItem('meetingDocuments') || '[]');
        storedDocs.push(document);
        sessionStorage.setItem('meetingDocuments', JSON.stringify(storedDocs));
      } catch (error) {
        console.warn('Failed to store document in sessionStorage:', error);
      }

      return document;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error; // Re-throw to be handled by the UI
    }
  }

  getDocuments(): MeetingDocument[] {
    return Array.from(this.documents.values());
  }

  removeDocument(documentId: string): void {
    this.documents.delete(documentId);
    
    // Update sessionStorage
    try {
      const storedDocs = JSON.parse(sessionStorage.getItem('meetingDocuments') || '[]');
      const filtered = storedDocs.filter((doc: MeetingDocument) => doc.id !== documentId);
      sessionStorage.setItem('meetingDocuments', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to update sessionStorage:', error);
    }
  }

  clearAllDocuments(): void {
    this.documents.clear();
    sessionStorage.removeItem('meetingDocuments');
  }

  // Enhanced document context with better formatting for LLM processing
  getEnhancedDocumentContext(useFullDocument: boolean = true): string {
    const docs = this.getDocuments();
    if (docs.length === 0) return '';

    let context = '\n\n╔══════════════════════════════════════╗\n';
    context += '║            DOCUMENT LIBRARY          ║\n';
    context += '╚══════════════════════════════════════╝\n';
    context += '\nINSTRUCTIONS FOR AI ASSISTANT:\n';
    context += '- When referencing information, cite: [Document Name, Page X]\n';
    context += '- If information spans multiple pages, note the range\n';
    context += '- Distinguish between direct quotes and paraphrasing\n';
    context += '- If asked about something not in the documents, clearly state this\n';
    
    if (useFullDocument) {
      context += '- You have full access to document content - use your natural language understanding\n';
      context += '- Cross-reference information across documents when helpful\n\n';
    } else {
      context += '- You have access to document summaries and key points\n';
      context += '- For detailed information, you may need to ask for clarification\n\n';
    }

    docs.forEach((doc, index) => {
      const pageCount = this.getPageCount(doc.content);
      
      context += `\n📄 DOCUMENT ${index + 1}: ${doc.filename}\n`;
      context += `📊 Pages: ${pageCount}\n`;
      context += `📝 AI Summary: ${doc.summary}\n`;
      
      if (doc.keyPoints && doc.keyPoints.length > 0) {
        context += `🎯 Key Points:\n${doc.keyPoints.map(point => `  • ${point}`).join('\n')}\n`;
      }
      
      if (useFullDocument) {
        context += `\n📖 FULL CONTENT:\n${doc.content}\n`;
      } else {
        context += `\n📋 SUMMARY ONLY - Full content available if needed\n`;
      }
      
      context += '\n' + '═'.repeat(60) + '\n';
    });

    context += '\n╚═══════════════════════════════════════╝\n';
    context += useFullDocument ? 'END OF DOCUMENT LIBRARY\n' : 'END OF DOCUMENT SUMMARIES\n';
    
    const contextType = useFullDocument ? 'full document' : 'summary';
    console.log(`DocumentService: Generated ${contextType} context with ${docs.length} documents (${context.length} characters total)`);
    
    return context;
  }

  // Legacy method maintained for backward compatibility (now uses enhanced version)
  getDocumentContext(): string {
    return this.getEnhancedDocumentContext(true);
  }

  restoreDocuments(): void {
    try {
      const storedDocs = JSON.parse(sessionStorage.getItem('meetingDocuments') || '[]');
      storedDocs.forEach((doc: MeetingDocument) => {
        this.documents.set(doc.id, doc);
      });
    } catch (error) {
      console.warn('Failed to restore documents from sessionStorage:', error);
    }
  }

  // Process additional documents from meeting data
  async restoreAdditionalDocuments(additionalDocuments: Array<{
    id: string;
    name: string;
    type: string;
    content: string;
    size: number;
  }>): Promise<void> {
    if (!additionalDocuments || additionalDocuments.length === 0) {
      return;
    }

    console.log(`DocumentService: Processing ${additionalDocuments.length} additional documents`);

    for (const additionalDoc of additionalDocuments) {
      try {
        // Process the document content using existing AI pipeline
        const processed = await this.processDocument(additionalDoc.content, additionalDoc.name);
        
        const document: MeetingDocument = {
          id: additionalDoc.id,
          filename: additionalDoc.name,
          fileType: additionalDoc.type,
          fileSize: additionalDoc.size,
          content: processed.content,
          summary: processed.summary,
          keyPoints: processed.keyPoints,
          uploadTimestamp: Date.now()
        };

        // Add to in-memory storage
        this.documents.set(document.id, document);
        
        // Store in sessionStorage as backup
        try {
          const storedDocs = JSON.parse(sessionStorage.getItem('meetingDocuments') || '[]');
          storedDocs.push(document);
          sessionStorage.setItem('meetingDocuments', JSON.stringify(storedDocs));
        } catch (error) {
          console.warn('Failed to store additional document in sessionStorage:', error);
        }

        console.log(`DocumentService: Processed additional document: ${additionalDoc.name}`);
      } catch (error) {
        console.error(`DocumentService: Error processing additional document ${additionalDoc.name}:`, error);
      }
    }
  }
}

export const documentService = new DocumentService();
