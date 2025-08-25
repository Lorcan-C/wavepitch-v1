
import React from "react";
import { SpeechEnabledInput } from "../../../../../shared/ui/speech-enabled-input";
import { DocumentUpload } from "../../../../../shared/ui/DocumentUpload";
import { MeetingDocument } from "../../../../../shared/types/document";

interface FormInputSectionProps {
  title: string;
  description: string;
  textLabel?: string;
  textValue: string;
  onTextChange: (value: string) => void;
  textPlaceholder: string;
  textRows?: number;
  documentsLabel?: string;
  documents?: MeetingDocument[];
  onDocumentsChange?: (documents: MeetingDocument[]) => void;
  showDocuments?: boolean;
}

export const FormInputSection = ({
  title,
  description,
  textLabel,
  textValue,
  onTextChange,
  textPlaceholder,
  textRows = 4,
  documentsLabel,
  documents = [],
  onDocumentsChange,
  showDocuments = true
}: FormInputSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        
        <div className="space-y-4">
          {textLabel && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{textLabel}</label>
              <SpeechEnabledInput
                value={textValue}
                onChange={onTextChange}
                placeholder={textPlaceholder}
                variant="textarea"
                rows={textRows}
              />
            </div>
          )}
          
          {!textLabel && (
            <div className="space-y-2">
              <SpeechEnabledInput
                value={textValue}
                onChange={onTextChange}
                placeholder={textPlaceholder}
                variant="textarea"
                rows={textRows}
              />
            </div>
          )}
          
          {showDocuments && onDocumentsChange && (
            <div className="space-y-2">
              {documentsLabel && <label className="text-sm font-medium">{documentsLabel}</label>}
              <DocumentUpload
                documents={documents}
                onDocumentsChange={onDocumentsChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
