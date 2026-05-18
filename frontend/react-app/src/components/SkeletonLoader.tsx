import React from 'react';

export function SkeletonLoader() {
  return (
    <div className="animate-pulse bg-gray-300 rounded-md dark:bg-gray-700">
      {/* Placeholder for content */}
      <div className="h-4 bg-gray-400 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-400 rounded w-1/2"></div>
    </div>
  );
}