import React from 'react';

export interface AttachmentItem {
  id: string;
  file?: File;
  url?: string;
  name?: string;
  size?: number;
  type?: string;
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
      {items.map(({ id, file, url, name, size, type }) => {
        const displayName = name || file?.name || 'Archivo';
        const mimeType = type || file?.type || '';
        const displaySize = size || file?.size || 0;
        const isPdf = mimeType.includes('pdf');
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
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline break-all"
                  >
                    {displayName}
                  </a>
                ) : (
                  <div className="text-sm font-medium text-text-primary break-all">{displayName}</div>
                )}
                <div className="text-xs text-gray-500">{formatFileSize(displaySize)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="text-gray-400 hover:text-red-600"
              aria-label={`Eliminar archivo ${file?.name || displayName}`}
            >
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
