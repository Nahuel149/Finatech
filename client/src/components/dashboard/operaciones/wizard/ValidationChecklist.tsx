import React from 'react';

interface Props {
  items: string[];
  loading?: boolean;
}

export const ValidationChecklist: React.FC<Props> = ({ items, loading = false }) => (
  <div id="validation-messages" className="mb-4">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start">
        <i className="fa-solid fa-circle-info text-blue-600 mr-2 mt-1" />
        <div className="flex-1">
          <div className="font-medium text-blue-800">Validaciones automáticas</div>
          {loading ? (
            <ul className="text-sm text-blue-700 mt-2 space-y-2 animate-pulse">
              <li className="h-3 bg-blue-100 rounded w-3/4" />
              <li className="h-3 bg-blue-100 rounded w-2/3" />
              <li className="h-3 bg-blue-100 rounded w-1/2" />
            </ul>
          ) : (
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              {items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-blue-600 text-xs" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  </div>
);
