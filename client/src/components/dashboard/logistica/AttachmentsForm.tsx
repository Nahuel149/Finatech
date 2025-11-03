import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '../../icons/HeroiconsOutline';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const AttachmentsForm: React.FC = () => {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <section>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Adjuntos</h3>

      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudArrowUpIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          Arrastrá archivos aquí o{' '}
          <button
            type="button"
            onClick={openFileDialog}
            className="font-medium text-primary hover:text-blue-700"
          >
            seleccionalos
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Formatos soportados: PDF, DOC(X), XLS(X), JPG, PNG • Máx. 10MB por archivo
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        />
      </div>

      {attachedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-text-primary">
            Archivos adjuntos ({attachedFiles.length})
          </h4>
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="text-danger hover:text-red-700 transition-colors"
                aria-label={`Eliminar ${file.name}`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AttachmentsForm;
