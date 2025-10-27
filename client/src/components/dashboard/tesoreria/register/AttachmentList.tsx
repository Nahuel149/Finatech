import React from 'react';

export interface AttachmentItem {
  id: string;
  file: File;
}

interface AttachmentListProps {
  items: AttachmentItem[];
  onRemove: (id: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const idx = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
};

export const AttachmentList: React.FC<AttachmentListProps> = ({ items, onRemove }) => {
  if (!items.length) {
    return null;
  }

  return (
    <div id="file-list" className="mt-3 space-y-2">
      {items.map(({ id, file }) => {
        const isPdf = file.type.includes('pdf');
        return (
          <div
            key={id}
            className="file-item flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex items-center">
              <i
                className={`fa-solid ${isPdf ? 'fa-file-pdf text-red-600' : 'fa-image text-blue-600'} mr-3`}
              />
              <div>
                <div className="text-sm font-medium text-text-primary">{file.name}</div>
                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="text-gray-400 hover:text-red-600"
              aria-label={`Eliminar archivo ${file.name}`}
            >
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
