import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { documentService } from '@/services/documentService';
import type {
  DocumentProcessingStatus,
  DocumentUploadOptions,
  MeetingDocument,
} from '@/types/document';

interface DocumentState {
  documents: MeetingDocument[];
  status: DocumentProcessingStatus;
  currentProcessingFile: string | null;
  error: string | null;
}

interface DocumentActions {
  uploadDocument: (file: File, options?: DocumentUploadOptions) => Promise<void>;
  removeDocument: (documentId: string) => void;
  clearDocuments: () => void;
  clearError: () => void;
  generateMeetingContext: () => string;
  getDocumentById: (id: string) => MeetingDocument | undefined;
}

interface DocumentStore extends DocumentState, DocumentActions {}

export const useDocumentStore = create<DocumentStore>()(
  immer((set, get) => ({
    // State
    documents: [],
    status: 'idle',
    currentProcessingFile: null,
    error: null,

    // Actions
    uploadDocument: async (file: File, options = {}) => {
      set((state) => {
        state.status = 'processing';
        state.currentProcessingFile = file.name;
        state.error = null;
      });

      try {
        const result = await documentService.processDocument(file, options);

        set((state) => {
          if (result.success && result.document) {
            state.documents.push(result.document);
            state.status = 'completed';
          } else {
            state.status = 'error';
            state.error = result.error || 'Failed to process document';
          }
          state.currentProcessingFile = null;
        });
      } catch (error) {
        set((state) => {
          state.status = 'error';
          state.error = error instanceof Error ? error.message : 'Unknown error';
          state.currentProcessingFile = null;
        });
      }
    },

    removeDocument: (documentId: string) => {
      set((state) => {
        state.documents = state.documents.filter((doc) => doc.id !== documentId);
      });
    },

    clearDocuments: () => {
      set((state) => {
        state.documents = [];
        state.status = 'idle';
        state.error = null;
        state.currentProcessingFile = null;
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
        if (state.status === 'error') {
          state.status = 'idle';
        }
      });
    },

    generateMeetingContext: () => {
      const { documents } = get();
      return documentService.generateMeetingContext(documents);
    },

    getDocumentById: (id: string) => {
      const { documents } = get();
      return documents.find((doc) => doc.id === id);
    },
  })),
);

// Selectors for optimized re-renders
export const useDocuments = () => useDocumentStore((state) => state.documents);
export const useDocumentStatus = () =>
  useDocumentStore((state) => ({
    status: state.status,
    currentProcessingFile: state.currentProcessingFile,
    error: state.error,
  }));
export const useDocumentActions = () =>
  useDocumentStore((state) => ({
    uploadDocument: state.uploadDocument,
    removeDocument: state.removeDocument,
    clearDocuments: state.clearDocuments,
    clearError: state.clearError,
    generateMeetingContext: state.generateMeetingContext,
    getDocumentById: state.getDocumentById,
  }));
