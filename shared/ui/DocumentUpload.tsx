
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './button';
import { Badge } from './badge';
import { FileText, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from './sonner';
import { Alert, AlertDescription } from './alert';
import { MeetingDocument } from '../types/document';
import { documentService } from '@/services/documentService';

interface DocumentUploadProps {
  documents: MeetingDocument[];
  onDocumentsChange: (documents: MeetingDocument[]) => void;
  disabled?: boolean;
  userContext?: string;
}

export function DocumentUpload({ documents, onDocumentsChange, disabled = false, userContext }: DocumentUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setUploadError(null);
    
    try {
      for (const file of acceptedFiles) {
        setProcessingFile(file.name);
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        // Check if document already exists
        const existingDoc = documents.find(doc => doc.filename === file.name);
        if (existingDoc) {
          toast.info(`Document ${file.name} is already uploaded`);
          continue;
        }

        toast.info(`Processing ${file.name}...`);
        
        try {
          const document = await documentService.addDocument(file, userContext);
          
          const updatedDocuments = [...documents, document];
          onDocumentsChange(updatedDocuments);
          
          toast.success(`${file.name} processed and added to meeting context`);
        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error occurred';
          
          // Show specific error messages based on error type
          if (errorMessage.includes('Word documents')) {
            toast.error(`${file.name}: Word documents not supported. Please convert to PDF or text format.`);
          } else if (errorMessage.includes('PDF')) {
            toast.error(`${file.name}: PDF processing failed. Please try a different PDF or convert to text format.`);
          } else if (errorMessage.includes('empty')) {
            toast.error(`${file.name}: Document appears to be empty or corrupted.`);
          } else {
            toast.error(`Failed to process ${file.name}: ${errorMessage}`);
          }
          
          setUploadError(`Failed to process some documents. ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error processing documents:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to process documents');
      setUploadError(`Upload failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setProcessingFile(null);
    }
  }, [documents, onDocumentsChange, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true,
    disabled: disabled || isProcessing
  });

  const removeDocument = (documentId: string) => {
    documentService.removeDocument(documentId);
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    onDocumentsChange(updatedDocuments);
    toast.info('Document removed from meeting context');
    setUploadError(null); // Clear any previous errors
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Upload Error Alert */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <div className="text-sm">
            {isProcessing ? (
              <span className="text-primary">
                {processingFile ? `Processing ${processingFile}...` : 'Processing documents...'}
              </span>
            ) : isDragActive ? (
              <span className="text-primary">Drop documents here</span>
            ) : (
              <>
                <span className="text-foreground">Drop documents or </span>
                <Button variant="link" className="p-0 h-auto text-primary">
                  click to upload
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Supports: PDF, TXT, MD (max 10MB each) • Word docs: convert to PDF
          </p>
        </div>
      </div>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Meeting Documents ({documents.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)} • {doc.keyPoints?.length || 0} key points
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
