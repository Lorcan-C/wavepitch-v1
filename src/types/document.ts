// Document processing types - flexible and integrable
export interface ExtractedEntity {
  extractionClass: string; // Flexible - let langextract determine categories
  extractionText: string;
  attributes: Record<string, unknown>;
}

export interface DocumentProcessingResult {
  success: boolean;
  content?: string;
  summary?: string;
  keyPoints?: string[];
  extractedData?: ExtractedEntity[];
  error?: string;
}

export interface MeetingDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  content: string;
  summary?: string;
  keyPoints?: string[];
  extractedData?: ExtractedEntity[];
  uploadTimestamp: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
}

export interface DocumentUploadOptions {
  enableEntityExtraction?: boolean;
  userContext?: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// Integration interface for meeting context
export interface MeetingIntegration {
  addToMeeting?: (documents: MeetingDocument[]) => void;
  generateMeetingContext?: (documents: MeetingDocument[]) => string;
}

export type DocumentProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
