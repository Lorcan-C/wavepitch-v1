import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileDropzoneProps {
  onFilesChange?: (files: File[]) => void;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ 
  onFilesChange,
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const allFiles = [...files, ...droppedFiles];
    setFiles(allFiles);
    onFilesChange?.(allFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        `}
      >
        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Drop files here</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-900">{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;