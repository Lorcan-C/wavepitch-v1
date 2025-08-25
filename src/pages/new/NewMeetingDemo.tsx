import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Using inline error handling instead of toast notifications
import { useDropzone } from 'react-dropzone';
import { 
  Sparkles, 
  FileText, 
  Pencil, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  RefreshCw,
  Upload,
  X,
  Loader2,
  Mic,
  MicOff
} from "lucide-react";

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/pdf': ['.pdf']
};

const UI_DELAYS = {
  PROCESSING: 1000,
  GENERATION: 500,
  PROGRESS_STEP: 200,
  PROGRESS_HIDE: 1000
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface MeetingDocument {
  id: string;
  filename: string;
  content: string;
  fileSize: number;
  keyPoints?: string[];
  summary?: string;
  type: 'pdf' | 'txt' | 'md';
  uploadedAt: Date;
}

interface GeneratedExpert {
  id: string;
  name: string;
  role: string;
  description: string;
  isEditing: boolean;
  isExpanded: boolean;
  isEditingDescription: boolean;
}

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateId = (prefix: string): string => `${prefix}-${Date.now()}`;

// ============================================
// MOCK SERVICES (Move to separate file in production)
// ============================================

class MockDocumentService {
  private documents = new Map<string, MeetingDocument>();

  async addDocument(file: File): Promise<MeetingDocument> {
    await new Promise(resolve => setTimeout(resolve, UI_DELAYS.PROCESSING));
    
    const content = await file.text();
    const doc: MeetingDocument = {
      id: generateId('doc'),
      filename: file.name,
      content,
      fileSize: file.size,
      type: file.name.endsWith('.pdf') ? 'pdf' : 
            file.name.endsWith('.md') ? 'md' : 'txt',
      uploadedAt: new Date(),
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      summary: 'This is a mock summary of the document content.'
    };
    
    this.documents.set(doc.id, doc);
    return doc;
  }

  removeDocument(id: string): void {
    this.documents.delete(id);
  }

  getDocumentContext(): string {
    const docs = Array.from(this.documents.values());
    return docs.map(d => `${d.filename}: ${d.summary}`).join('\n');
  }
}

class MockAgentService {
  async generateExperts(
    topic: string, 
    role: string, 
    progressCallback?: (p: number) => void
  ): Promise<GeneratedExpert[]> {
    // Simulate generation with progress
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, UI_DELAYS.PROGRESS_STEP));
      progressCallback?.(i);
    }
    
    // Return mock experts based on topic
    return [
      {
        id: 'expert-1',
        name: 'Sarah Chen',
        role: 'Technical Architect',
        description: 'Senior architect with 15 years experience in cloud infrastructure and enterprise systems.',
        isEditing: false,
        isExpanded: false,
        isEditingDescription: false
      },
      {
        id: 'expert-2',
        name: 'Michael Roberts',
        role: 'Business Analyst',
        description: 'Expert in market analysis, ROI calculations, and strategic business planning.',
        isEditing: false,
        isExpanded: false,
        isEditingDescription: false
      },
      {
        id: 'expert-3',
        name: 'Lisa Johnson',
        role: 'Project Manager',
        description: 'PMP certified with expertise in agile methodologies and stakeholder management.',
        isEditing: false,
        isExpanded: false,
        isEditingDescription: false
      }
    ];
  }

  async generateMeetingDescription(topic: string, experts: GeneratedExpert[]): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, UI_DELAYS.GENERATION));
    return `Strategic planning session focused on ${topic} with expert advisors from technical, business, and project management domains.`;
  }

  async generateUserDescription(topic: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, UI_DELAYS.GENERATION));
    return 'You are the meeting organizer and primary stakeholder driving this initiative forward.';
  }

  async extractOpportunity(documents: MeetingDocument[], info: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, UI_DELAYS.GENERATION));
    return 'Digital transformation initiative for enterprise cloud migration';
  }
}

// Service instances
const mockDocumentService = new MockDocumentService();
const mockAgentService = new MockAgentService();

// ============================================
// REUSABLE COMPONENTS
// ============================================

// Component: EditableField - Reusable for editable text fields
const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onChange,
  isEditing,
  onToggleEdit,
  placeholder,
  maxLength,
  rows = 3,
  className = ""
}) => {
  if (isEditing) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-sm w-full bg-transparent border-2 border-dashed border-primary rounded p-2 focus:outline-none resize-none ${className}`}
        onBlur={onToggleEdit}
        onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && onToggleEdit()}
        rows={rows}
        autoFocus
        maxLength={maxLength}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div 
      className={`text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group flex items-start gap-2 p-2 bg-muted/30 rounded ${className}`}
      onClick={onToggleEdit}
    >
      <div className="flex-1">{value || placeholder}</div>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5 flex-shrink-0" />
    </div>
  );
};

// Component: CollapsibleSection - Reusable collapsible container
interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  className = ""
}) => (
  <div className={`space-y-2 ${className}`}>
    <button
      onClick={onToggle}
      className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
    >
      {isExpanded ? (
        <>
          {title}
          <ChevronUp className="h-3 w-3" />
        </>
      ) : (
        <>
          {title}
          <ChevronDown className="h-3 w-3" />
        </>
      )}
    </button>
    {isExpanded && <div className="mt-2">{children}</div>}
  </div>
);

// Component: SpeechEnabledInput
interface SpeechEnabledInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'input' | 'textarea';
  rows?: number;
}

const SpeechEnabledInput: React.FC<SpeechEnabledInputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  variant = 'input',
  rows = 4 
}) => {
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    setIsListening(!isListening);
    console.log(isListening ? "Speech recognition stopped" : "Speech recognition started (mock)");
  };

  const InputComponent = variant === 'textarea' ? 'textarea' : 'input';
  const inputProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder,
    className: "w-full p-2 pr-10 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary",
    ...(variant === 'textarea' && { rows })
  };

  return (
    <div className="relative">
      {React.createElement(InputComponent, inputProps)}
      <button
        type="button"
        onClick={toggleListening}
        className={`absolute right-2 ${variant === 'textarea' ? 'top-2' : 'top-1/2 -translate-y-1/2'} p-1.5 rounded-md hover:bg-gray-100 transition-colors`}
      >
        {isListening ? (
          <MicOff className="h-4 w-4 text-red-500" />
        ) : (
          <Mic className="h-4 w-4 text-gray-500" />
        )}
      </button>
    </div>
  );
};

// Component: DocumentUpload
interface DocumentUploadProps {
  documents: MeetingDocument[];
  onDocumentsChange: (documents: MeetingDocument[]) => void;
  disabled?: boolean;
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  documents, 
  onDocumentsChange, 
  disabled = false,
  className = ""
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return;

    setIsProcessing(true);
    
    try {
      for (const file of acceptedFiles) {
        setProcessingFile(file.name);
        
        if (file.size > FILE_SIZE_LIMIT) {
          console.error(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        if (documents.find(doc => doc.filename === file.name)) {
          console.log(`Document ${file.name} is already uploaded`);
          continue;
        }

        console.log(`Processing ${file.name}...`);
        
        try {
          const document = await mockDocumentService.addDocument(file);
          onDocumentsChange([...documents, document]);
          console.log(`${file.name} processed successfully`);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          console.error(`Failed to process ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Error processing documents:', error);
      console.error('Failed to process documents');
    } finally {
      setIsProcessing(false);
      setProcessingFile(null);
    }
  }, [documents, onDocumentsChange, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
    disabled: disabled || isProcessing
  });

  const removeDocument = (documentId: string) => {
    mockDocumentService.removeDocument(documentId);
    onDocumentsChange(documents.filter(doc => doc.id !== documentId));
    console.log('Document removed');
  };

  return (
    <div className={`space-y-3 ${className}`}>
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
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-primary">
                {processingFile ? `Processing ${processingFile}...` : 'Processing documents...'}
              </span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm">
                {isDragActive ? (
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
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Supports: PDF, TXT, MD (max 10MB each)
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Meeting Documents ({documents.length})</h4>
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
};

// Component: ProgressBar
interface ProgressBarProps {
  progress: number;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label = "Generating expert team..." }) => (
  <div className="space-y-2 py-4">
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-primary font-medium">{progress}%</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div 
        className="bg-primary h-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// Component: ExpertCard
interface ExpertCardProps {
  expert: GeneratedExpert;
  onToggleEdit: (expertId: string) => void;
  onUpdateExpert: (expertId: string, field: keyof GeneratedExpert, value: string) => void;
  onToggleDescriptionEdit?: (expertId: string) => void;
  variant?: 'simple' | 'detailed';
  isExpanded?: boolean;
  onToggleExpand?: (expertId: string) => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({
  expert,
  onToggleEdit,
  onUpdateExpert,
  onToggleDescriptionEdit,
  variant = 'simple',
  isExpanded = false,
  onToggleExpand
}) => {
  const titleField = variant === 'detailed' ? 'role' : 'name';
  const titleValue = variant === 'detailed' ? expert.role : expert.name;

  return (
    <div className={`border rounded-lg ${variant === 'detailed' ? 'p-3 hover:border-muted-foreground/40 transition-colors' : 'p-4'}`}>
      <div className="flex justify-between items-start mb-2">
        {expert.isEditing ? (
          <input
            value={titleValue}
            onChange={(e) => onUpdateExpert(expert.id, titleField, e.target.value)}
            className={`font-medium text-sm border-b border-dashed border-muted-foreground bg-transparent ${
              variant === 'detailed' ? 'text-base border-b-2 border-primary w-full focus:outline-none' : ''
            }`}
            onBlur={() => onToggleEdit(expert.id)}
            onKeyDown={(e) => e.key === 'Enter' && onToggleEdit(expert.id)}
            autoFocus
          />
        ) : (
          <h4 
            className={`font-medium text-sm cursor-pointer group flex items-center gap-2 ${
              variant === 'detailed' 
                ? 'text-base hover:border-b hover:border-dashed hover:border-muted-foreground mb-2 pb-1 transition-all' 
                : 'hover:text-primary'
            }`}
            onClick={() => onToggleEdit(expert.id)}
          >
            {titleValue}
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </h4>
        )}
      </div>
      
      {variant === 'simple' && (
        <>
          <p className="text-xs text-muted-foreground mb-1">{expert.role}</p>
          <p className="text-xs text-muted-foreground">{expert.description}</p>
        </>
      )}
      
      {variant === 'detailed' && onToggleExpand && (
        <CollapsibleSection
          title={isExpanded ? "Hide role description" : "See role description"}
          isExpanded={isExpanded}
          onToggle={() => onToggleExpand(expert.id)}
        >
          <p className="text-xs text-muted-foreground italic mb-1">Click to edit description</p>
          <EditableField
            value={expert.description}
            onChange={(value) => onUpdateExpert(expert.id, 'description', value)}
            isEditing={expert.isEditingDescription}
            onToggleEdit={() => onToggleDescriptionEdit?.(expert.id)}
            placeholder="Enter role description..."
          />
        </CollapsibleSection>
      )}
    </div>
  );
};

// Component: ExpertManagementSection
interface ExpertManagementSectionProps {
  title: string;
  generatedExperts: GeneratedExpert[];
  hasGeneratedExperts: boolean;
  isGeneratingSuggestions: boolean;
  expertGenerationProgress: number;
  showExpertGenerationProgress: boolean;
  onGenerateExperts: () => void;
  onRegenerateExperts: () => void;
  onToggleExpertEdit: (expertId: string) => void;
  onUpdateExpert: (expertId: string, field: keyof GeneratedExpert, value: string) => void;
  onToggleDescriptionEdit?: (expertId: string) => void;
  generateButtonText?: string;
  variant?: 'simple' | 'detailed';
  additionalContext?: string;
  onAdditionalContextChange?: (value: string) => void;
  additionalDocuments?: MeetingDocument[];
  onAdditionalDocumentsChange?: (documents: MeetingDocument[]) => void;
  showAdditionalInputs?: boolean;
}

const ExpertManagementSection: React.FC<ExpertManagementSectionProps> = ({
  title,
  generatedExperts,
  hasGeneratedExperts,
  isGeneratingSuggestions,
  expertGenerationProgress,
  showExpertGenerationProgress,
  onGenerateExperts,
  onRegenerateExperts,
  onToggleExpertEdit,
  onUpdateExpert,
  onToggleDescriptionEdit,
  generateButtonText = "Generate Team Members",
  variant = 'simple',
  additionalContext = '',
  onAdditionalContextChange,
  additionalDocuments = [],
  onAdditionalDocumentsChange,
  showAdditionalInputs = false
}) => {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (hasGeneratedExperts && generatedExperts.length > 0) {
      setExpandedDescriptions(new Set(generatedExperts.map(expert => expert.id)));
    }
  }, [hasGeneratedExperts, generatedExperts]);

  const toggleDescription = (expertId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      newSet.has(expertId) ? newSet.delete(expertId) : newSet.add(expertId);
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        {hasGeneratedExperts ? (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{title}</h3>
            <Button variant="outline" size="sm" onClick={onRegenerateExperts}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          </div>
        ) : (
          <h3 className="text-lg font-medium mb-3">{title}</h3>
        )}
        
        {!hasGeneratedExperts && !isGeneratingSuggestions && (
          <Button onClick={onGenerateExperts} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            {generateButtonText}
          </Button>
        )}

        {showExpertGenerationProgress && (
          <ProgressBar progress={expertGenerationProgress} />
        )}

        {hasGeneratedExperts && (
          <div className="space-y-3">
            {generatedExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onToggleEdit={onToggleExpertEdit}
                onUpdateExpert={onUpdateExpert}
                onToggleDescriptionEdit={onToggleDescriptionEdit}
                variant={variant}
                isExpanded={expandedDescriptions.has(expert.id)}
                onToggleExpand={toggleDescription}
              />
            ))}

            {showAdditionalInputs && (
              <div className="space-y-4">
                <h4 className="text-md font-medium">Add anything else they should know</h4>
                
                <DocumentUpload
                  documents={additionalDocuments}
                  onDocumentsChange={onAdditionalDocumentsChange || (() => {})}
                />
                
                <SpeechEnabledInput
                  value={additionalContext}
                  onChange={onAdditionalContextChange || (() => {})}
                  placeholder="Any additional context, background information, or specific details..."
                  variant="textarea"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Component: WorkflowContainer
interface WorkflowContainerProps {
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  actionButton?: React.ReactNode;
  bottomActionButton?: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

const WorkflowContainer: React.FC<WorkflowContainerProps> = ({
  title,
  icon,
  onBack,
  actionButton,
  bottomActionButton,
  currentStep,
  totalSteps,
  children
}) => (
  <div className="w-full bg-gray-50/50 p-4 rounded-lg border border-gray-100">
    <h2 className="text-xl font-bold mb-4 flex items-center justify-center text-[#0EA5E9]">
      {icon}
      {title}
    </h2>
    
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {actionButton}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i + 1}
              className={`h-1 flex-1 rounded ${
                i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {bottomActionButton && (
        <div className="mt-4 pt-4 border-t border-border flex justify-center">
          {bottomActionButton}
        </div>
      )}
    </div>
  </div>
);

// ============================================
// CUSTOM HOOKS
// ============================================

const useAgentGeneration = () => {
  const [userRole, setUserRole] = useState("");
  const [generatedExperts, setGeneratedExperts] = useState<GeneratedExpert[]>([]);
  const [hasGeneratedExperts, setHasGeneratedExperts] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [expertGenerationProgress, setExpertGenerationProgress] = useState(0);
  const [showExpertGenerationProgress, setShowExpertGenerationProgress] = useState(false);

  const generateExpertTeam = async (
    topic: string, 
    userRole?: string, 
    callback?: (experts: GeneratedExpert[]) => void
  ) => {
    const role = userRole || '';
    if (!topic.trim()) {
      console.error("Please provide meeting topic");
      return;
    }
    
    setIsGeneratingSuggestions(true);
    setShowExpertGenerationProgress(true);
    setExpertGenerationProgress(0);
    
    try {
      const experts = await mockAgentService.generateExperts(
        topic, 
        role,
        (progress) => setExpertGenerationProgress(progress)
      );
      
      setGeneratedExperts(experts);
      setHasGeneratedExperts(true);
      callback?.(experts);
      
      setTimeout(() => {
        setShowExpertGenerationProgress(false);
      }, UI_DELAYS.PROGRESS_HIDE);
      
      console.log(`Generated ${experts.length} expert advisors!`);
    } catch (error) {
      console.error('Error generating expert team:', error);
      console.error("Failed to generate expert team");
      setShowExpertGenerationProgress(false);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const regenerateExpertTeam = async (topic: string) => {
    setHasGeneratedExperts(false);
    setGeneratedExperts([]);
    await generateExpertTeam(topic);
  };

  const toggleExpertEdit = (expertId: string) => {
    setGeneratedExperts(prev => prev.map(expert => 
      expert.id === expertId 
        ? { ...expert, isEditing: !expert.isEditing }
        : expert
    ));
  };

  const updateExpert = (expertId: string, field: keyof GeneratedExpert, value: string) => {
    setGeneratedExperts(prev => prev.map(expert => 
      expert.id === expertId 
        ? { ...expert, [field]: value }
        : expert
    ));
  };

  const toggleDescriptionEdit = (expertId: string) => {
    setGeneratedExperts(prev => prev.map(expert => 
      expert.id === expertId 
        ? { ...expert, isEditingDescription: !expert.isEditingDescription }
        : expert
    ));
  };

  const resetAgentGeneration = () => {
    setUserRole("");
    setGeneratedExperts([]);
    setHasGeneratedExperts(false);
    setIsGeneratingSuggestions(false);
    setExpertGenerationProgress(0);
    setShowExpertGenerationProgress(false);
  };

  return {
    userRole,
    setUserRole,
    generatedExperts,
    hasGeneratedExperts,
    isGeneratingSuggestions,
    expertGenerationProgress,
    showExpertGenerationProgress,
    generateExpertTeam,
    regenerateExpertTeam,
    toggleExpertEdit,
    updateExpert,
    toggleDescriptionEdit,
    resetAgentGeneration
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

export const NewMeetingDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [documents, setDocuments] = useState<MeetingDocument[]>([]);
  const [pitchInfo, setPitchInfo] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [additionalDocuments, setAdditionalDocuments] = useState<MeetingDocument[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [showMeetingDescription, setShowMeetingDescription] = useState(false);
  const [showUserDescription, setShowUserDescription] = useState(false);
  const [isEditingMeetingDescription, setIsEditingMeetingDescription] = useState(false);
  const [isEditingUserDescription, setIsEditingUserDescription] = useState(false);

  const {
    generatedExperts,
    hasGeneratedExperts,
    isGeneratingSuggestions,
    expertGenerationProgress,
    showExpertGenerationProgress,
    generateExpertTeam,
    regenerateExpertTeam,
    toggleExpertEdit,
    updateExpert,
    toggleDescriptionEdit,
  } = useAgentGeneration();

  // Generate descriptions when experts are created
  useEffect(() => {
    if (hasGeneratedExperts && generatedExperts.length > 0 && meetingPurpose && !meetingDescription) {
      generateDescriptions();
    }
  }, [hasGeneratedExperts, generatedExperts, meetingPurpose]);

  const generateDescriptions = async () => {
    if (!meetingPurpose || generatedExperts.length === 0) return;
    
    try {
      setIsGeneratingDescriptions(true);
      
      const [meetingDesc, userDesc] = await Promise.all([
        mockAgentService.generateMeetingDescription(meetingPurpose, generatedExperts),
        mockAgentService.generateUserDescription(meetingPurpose)
      ]);
      
      setMeetingDescription(meetingDesc);
      setUserDescription(userDesc);
      
    } catch (error) {
      console.error('Failed to generate descriptions:', error);
      console.error("Failed to generate meeting descriptions");
    } finally {
      setIsGeneratingDescriptions(false);
    }
  };

  const handleGenerateExperts = async () => {
    const documentContext = mockDocumentService.getDocumentContext();
    const info = documentContext ? 
      `Pitch presentation with documents:\n${documentContext}` + 
      (pitchInfo.trim() ? `\n\nAdditional context: ${pitchInfo}` : '') :
      pitchInfo;
    
    if (!info.trim()) {
      console.error("Please provide pitch information or upload documents");
      return;
    }
    
    try {
      const opportunity = await mockAgentService.extractOpportunity(documents, pitchInfo);
      setMeetingPurpose(opportunity);
    } catch (error) {
      console.error('Failed to generate opportunity:', error);
      setMeetingPurpose("Preparation for client pitch presentation");
    }
    
    await generateExpertTeam(info, "Meeting Organizer");
    setCurrentStep(2);
  };

  const handleRegenerateExperts = () => {
    const documentContext = mockDocumentService.getDocumentContext();
    const info = documentContext || pitchInfo;
    regenerateExpertTeam(info);
  };

  const handleComplete = () => {
    if (!meetingPurpose.trim()) {
      console.error("Please specify the meeting purpose");
      return;
    }
    
    const meetingData = {
      documents,
      pitchInfo,
      experts: generatedExperts,
      meetingPurpose,
      meetingDescription,
      userDescription,
      additionalDocuments,
      additionalContext
    };
    
    console.log('Meeting created:', meetingData);
    console.log("Meeting created successfully!");
  };

  const canProceedFromStep1 = documents.length > 0 || pitchInfo.trim();

  const getActionButton = () => {
    if (currentStep === 1) {
      return (
        <Button 
          onClick={handleGenerateExperts}
          disabled={!canProceedFromStep1}
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate experts
        </Button>
      );
    }
    return (
      <Button 
        onClick={handleComplete} 
        disabled={!meetingPurpose.trim() || !hasGeneratedExperts || isGeneratingDescriptions}
        size="sm"
      >
        {isGeneratingDescriptions ? "Preparing..." : "Start Meeting"}
      </Button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <WorkflowContainer
        title="Pitch a new project"
        icon={<FileText className="mr-2 h-5 w-5 text-[#0EA5E9]" />}
        onBack={() => console.log('Navigate back')}
        actionButton={currentStep === 2 ? getActionButton() : null}
        bottomActionButton={getActionButton()}
        currentStep={currentStep}
        totalSteps={2}
      >
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium">
              Describe your client, their needs, or your key ideas, and/or upload relevant documents below.
            </label>
            <div className="space-y-2 p-4 bg-muted rounded-lg border border-dashed border-primary">
              <SpeechEnabledInput
                value={pitchInfo}
                onChange={setPitchInfo}
                placeholder="Type here or click mic for voice input"
                variant="textarea"
                rows={4}
              />
              <DocumentUpload
                documents={documents}
                onDocumentsChange={setDocuments}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {meetingPurpose && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Meeting purpose & goals</h3>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{meetingPurpose}</p>
                </div>

                {/* Meeting Description */}
                {(meetingDescription || isGeneratingDescriptions) && (
                  <CollapsibleSection
                    title={showMeetingDescription ? "Hide meeting description" : "See meeting description"}
                    isExpanded={showMeetingDescription}
                    onToggle={() => setShowMeetingDescription(!showMeetingDescription)}
                  >
                    {isGeneratingDescriptions ? (
                      <div className="text-sm text-muted-foreground p-2 bg-muted/30 rounded animate-pulse">
                        Generating personalized meeting description...
                      </div>
                    ) : (
                      <EditableField
                        value={meetingDescription}
                        onChange={setMeetingDescription}
                        isEditing={isEditingMeetingDescription}
                        onToggleEdit={() => setIsEditingMeetingDescription(!isEditingMeetingDescription)}
                        maxLength={300}
                      />
                    )}
                  </CollapsibleSection>
                )}

                {/* Your Role */}
                {(userDescription || isGeneratingDescriptions) && (
                  <CollapsibleSection
                    title={showUserDescription ? "Hide your role" : "See your role"}
                    isExpanded={showUserDescription}
                    onToggle={() => setShowUserDescription(!showUserDescription)}
                  >
                    {isGeneratingDescriptions ? (
                      <div className="text-sm text-muted-foreground p-2 bg-muted/30 rounded animate-pulse">
                        Analyzing your role...
                      </div>
                    ) : (
                      <EditableField
                        value={userDescription}
                        onChange={setUserDescription}
                        isEditing={isEditingUserDescription}
                        onToggleEdit={() => setIsEditingUserDescription(!isEditingUserDescription)}
                        maxLength={200}
                        rows={2}
                      />
                    )}
                  </CollapsibleSection>
                )}
              </div>
            )}

            <ExpertManagementSection
              title="Three experts will join your meeting"
              generatedExperts={generatedExperts}
              hasGeneratedExperts={hasGeneratedExperts}
              isGeneratingSuggestions={isGeneratingSuggestions}
              expertGenerationProgress={expertGenerationProgress}
              showExpertGenerationProgress={showExpertGenerationProgress}
              onGenerateExperts={handleGenerateExperts}
              onRegenerateExperts={handleRegenerateExperts}
              onToggleExpertEdit={toggleExpertEdit}
              onUpdateExpert={updateExpert}
              onToggleDescriptionEdit={toggleDescriptionEdit}
              generateButtonText="Generate Client Team"
              variant="detailed"
              additionalContext={additionalContext}
              onAdditionalContextChange={setAdditionalContext}
              additionalDocuments={additionalDocuments}
              onAdditionalDocumentsChange={setAdditionalDocuments}
              showAdditionalInputs={false}
            />
          </div>
        )}
      </WorkflowContainer>
    </div>
  );
};

export default NewMeetingDemo;