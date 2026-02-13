import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '../../icons/HeroiconsOutline';

interface AttachmentsFormProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const validateFile = (file: File): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return 'Tipo de archivo no permitido';
  }
  if (file.size > maxFileSize) {
    return 'El archivo excede el tamaño máximo de 10MB';
  }
  return null;
};

const AttachmentsForm: React.FC<AttachmentsFormProps> = ({ files, onFilesChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert('Errores en los archivos:\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
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

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-text-primary">
            Archivos adjuntos ({files.length})
          </h4>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
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
                onClick={() => removeFile(index)}
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
