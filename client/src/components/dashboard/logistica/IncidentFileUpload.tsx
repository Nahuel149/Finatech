import React, { useRef, useState } from 'react';

interface IncidentFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const IncidentFileUpload: React.FC<IncidentFileUploadProps> = ({
  files,
  onFilesChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido';
    }
    if (file.size > maxFileSize) {
      return 'El archivo excede el tamaño máximo de 10MB';
    }
    return null;
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach(file => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File): string => {
    if (file.type.includes('pdf')) return 'fa-file-pdf text-red-500';
    if (file.type.includes('image')) return 'fa-file-image text-green-500';
    if (file.type.includes('word')) return 'fa-file-word text-blue-500';
    if (file.type.includes('excel') || file.type.includes('sheet')) return 'fa-file-excel text-green-600';
    return 'fa-file text-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div 
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-blue-50' 
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-2">
          <i className={`fa-solid fa-cloud-upload-alt text-3xl ${isDragOver ? 'text-primary' : 'text-gray-400'}`}></i>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Arrastrá archivos aquí o <span className="text-primary">hacé clic para seleccionar</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG, DOC, XLS - Máximo 10MB por archivo
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Archivos adjuntos ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <i className={`fa-solid ${getFileIcon(file)} text-lg`}></i>
                  <div>
                    <div className="text-sm font-medium text-gray-700 truncate max-w-xs">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-red-600 hover:text-red-800 p-1 transition-colors"
                  title="Eliminar archivo"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};