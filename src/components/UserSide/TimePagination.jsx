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
    // Show more pages - increased from 7 to 11
    if (totalPages <= 11) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages = [];
    
    // Always show first 3 pages
    pages.push(0, 1, 2);
    
    if (currentPage > 4) {
      pages.push('ellipsis-start');
    }
    
    // Show more pages around current page (increased range)
    const start = Math.max(3, currentPage - 2);
    const end = Math.min(totalPages - 4, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 5) {
      pages.push('ellipsis-end');
    }
    
    // Always show last 3 pages
    if (totalPages > 3) {
      pages.push(totalPages - 3, totalPages - 2, totalPages - 1);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  console.log('🎯 TimePagination - visiblePages:', visiblePages);

  return (
    <div className="flex items-center justify-between space-x-1 py-4 w-full">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex-shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page buttons - now taking full available width */}
      <div className="flex items-center justify-center space-x-1 flex-1 overflow-x-auto">
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 py-1 flex-shrink-0">
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
              className={`px-4 py-2 rounded-lg border text-sm font-medium min-w-[140px] flex-shrink-0 ${
                currentPage === page
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={`${pageLabels[page]} (${segmentCount} segments)`}
            >
              <div className="text-xs whitespace-nowrap">{pageLabels[page]}</div>
              <div className="text-xs opacity-75">
                {segmentCount} segments
              </div>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex-shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TimePagination;