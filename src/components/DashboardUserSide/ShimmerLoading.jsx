import React from 'react';

const ShimmerLoading = ({ type = 'table', rows = 5 }) => {
  if (type === 'table') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/4 shimmer-animation"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 shimmer-animation"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 shimmer-animation"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3 shimmer-animation"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 shimmer-animation"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-4/5 shimmer-animation"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/5 shimmer-animation"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-20 shimmer-animation"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 shimmer-animation"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 shimmer-animation"></div>
              <div className="h-10 bg-gray-200 rounded shimmer-animation"></div>
            </div>
          ))}
        </div>
        <div className="flex space-x-4">
          <div className="h-10 bg-gray-200 rounded w-32 shimmer-animation"></div>
          <div className="h-10 bg-gray-200 rounded w-24 shimmer-animation"></div>
        </div>
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 shimmer-animation"></div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center">
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2 shimmer-animation"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mx-auto shimmer-animation"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default ShimmerLoading;