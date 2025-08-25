
export interface MeetingDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  content: string;
  summary?: string;
  keyPoints?: string[];
  uploadTimestamp: number;
}

export interface DocumentProcessingResult {
  content: string;
  summary: string;
  keyPoints: string[];
}
