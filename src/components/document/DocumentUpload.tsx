import React, { useCallback } from 'react';

import { useDropzone } from 'react-dropzone';

import { AlertCircle, FileText, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useDocumentActions, useDocumentStatus, useDocuments } from '@/stores/documentStore';
import type { DocumentUploadOptions } from '@/types/document';

interface DocumentUploadProps {
  options?: DocumentUploadOptions;
  className?: string;
  onUploadComplete?: (documentId: string) => void;
}

export function DocumentUpload({
  options = {},
  className = '',
  onUploadComplete,
}: DocumentUploadProps) {
  const documents = useDocuments();
  const { status, currentProcessingFile, error } = useDocumentStatus();
  const { uploadDocument, removeDocument, clearError } = useDocumentActions();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0]; // Handle one file at a time

      try {
        await uploadDocument(file, options);

        // Success feedback
        toast.success(`${file.name} processed successfully with entity extraction`);

        // Notify parent component if needed
        if (onUploadComplete) {
          const newDocument = documents.find((doc) => doc.filename === file.name);
          if (newDocument) {
            onUploadComplete(newDocument.id);
          }
        }
      } catch {
        toast.error(`Failed to process ${file.name}`);
      }
    },
    [uploadDocument, options, onUploadComplete, documents],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    disabled: status === 'processing',
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const isProcessing = status === 'processing';
  const hasError = status === 'error' && error;

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Processing {currentProcessingFile}...
              </p>
              <p className="text-xs text-gray-500">Extracting entities and generating summary</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? 'Drop document here...' : 'Upload document for AI analysis'}
              </p>
              <p className="text-xs text-gray-500">PDF, TXT, or MD files up to 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-800 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Processed Documents:</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{doc.filename}</span>
                    {doc.extractedData && doc.extractedData.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {doc.extractedData.length} entities
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      removeDocument(doc.id);
                      toast.info(`Removed ${doc.filename}`);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>

                {doc.summary && <p className="text-sm text-gray-600 mb-2">{doc.summary}</p>}

                {doc.extractedData && doc.extractedData.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.extractedData.slice(0, 4).map((entity, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {entity.extractionClass}: {entity.extractionText}
                      </span>
                    ))}
                    {doc.extractedData.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{doc.extractedData.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
