import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const TimePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  pageLabels,
  availablePages = []
}) => {
  console.log('🎯 TimePagination - currentPage:', currentPage);
  console.log('🎯 TimePagination - totalPages:', totalPages);
  console.log('🎯 TimePagination - pageLabels:', pageLabels);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages = [];
    
    // Always show first page
    pages.push(0);
    
    if (currentPage > 2) {
      pages.push('ellipsis-start');
    }
    
    // Show pages around current page
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 3) {
      pages.push('ellipsis-end');
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages - 1);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  console.log('🎯 TimePagination - visiblePages:', visiblePages);

  return (
    <div className="flex items-center justify-center space-x-1 py-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page buttons */}
      {visiblePages.map((page, index) => {
        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 py-1">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </span>
          );
        }

        const pageData = availablePages[page];
        const segmentCount = pageData?.segment_count || 0;

        console.log(`🎯 Rendering page ${page}, isCurrent: ${currentPage === page}`);

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium min-w-[120px] ${
              currentPage === page
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title={`${pageLabels[page]} (${segmentCount} segments)`}
          >
            <div className="text-xs">{pageLabels[page]}</div>
            <div className="text-xs opacity-75">
              {segmentCount} segments
            </div>
          </button>
        );
      })}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TimePagination;