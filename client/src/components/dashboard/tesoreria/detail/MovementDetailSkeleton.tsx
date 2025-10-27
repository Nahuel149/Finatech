import React from 'react';

export const MovementDetailSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    {[0, 1, 2, 3].map((section) => (
      <div key={section} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[0, 1, 2].map((line) => (
            <div key={line} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    ))}
  </div>
);
