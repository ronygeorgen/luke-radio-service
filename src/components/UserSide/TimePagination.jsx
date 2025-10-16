import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const TimePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  availablePages = []
}) => {
  console.log('🎯 TimePagination - currentPage:', currentPage);
  console.log('🎯 TimePagination - totalPages:', totalPages);
  console.log('🎯 TimePagination - availablePages:', availablePages);

  // Filter out pages without data and create page labels
  const pagesWithData = availablePages.filter(page => page.has_data);
  console.log('🎯 Pages with data:', pagesWithData);

  // Create page labels with date and time
  const pageLabels = pagesWithData.map(page => {
    const startTime = new Date(page.start_time);
    const endTime = new Date(page.end_time);

    // Desired format example: "Wed 1 Oct, 2025 19:00-20:00"
    const formatDate = (date) => {
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${weekday} ${day} ${month}, ${year}`;
    };

    const startDateStr = formatDate(startTime);
    const endDateStr = formatDate(endTime);

    const startTimeStr = startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const endTimeStr = endTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // If the start and end dates are the same (by date components), show one date
    const sameCalendarDate = (
      startTime.getFullYear() === endTime.getFullYear() &&
      startTime.getMonth() === endTime.getMonth() &&
      startTime.getDate() === endTime.getDate()
    );

    const label = sameCalendarDate
      ? `${startDateStr} ${startTimeStr}-${endTimeStr}`
      : `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;

    return {
      pageNumber: page.page,
      label,
      segmentCount: page.segment_count
    };
  });

  console.log('🎯 Generated page labels:', pageLabels);

  const getVisiblePages = () => {
    const totalVisiblePages = pageLabels.length;
    
    if (totalVisiblePages <= 7) {
      return Array.from({ length: totalVisiblePages }, (_, i) => i);
    }

    const currentIndex = pageLabels.findIndex(p => p.pageNumber === currentPage);
    const pages = [];
    
    // Always show first page
    pages.push(0);
    
    if (currentIndex > 3) {
      pages.push('ellipsis-start');
    }
    
    // Show pages around current page
    const start = Math.max(1, currentIndex - 1);
    const end = Math.min(totalVisiblePages - 2, currentIndex + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentIndex < totalVisiblePages - 4) {
      pages.push('ellipsis-end');
    }
    
    // Always show last page
    if (totalVisiblePages > 1) {
      pages.push(totalVisiblePages - 1);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (index) => {
    const pageData = pageLabels[index];
    if (pageData && pageData.pageNumber) {
      onPageChange(pageData.pageNumber);
    }
  };

  const getCurrentPageIndex = () => {
    return pageLabels.findIndex(p => p.pageNumber === currentPage);
  };

  const canGoPrevious = getCurrentPageIndex() > 0;
  const canGoNext = getCurrentPageIndex() < pageLabels.length - 1;

  return (
    <div className="flex items-center justify-between space-x-1 py-4 w-full">
      {/* Previous button */}
      <button
        onClick={() => {
          const currentIndex = getCurrentPageIndex();
          if (currentIndex > 0) {
            handlePageClick(currentIndex - 1);
          }
        }}
        disabled={!canGoPrevious}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex-shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page buttons */}
      <div className="flex items-center justify-center space-x-1 flex-1 overflow-x-auto">
        {visiblePages.map((pageIndex, index) => {
          if (pageIndex === 'ellipsis-start' || pageIndex === 'ellipsis-end') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 py-1 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </span>
            );
          }

          const pageData = pageLabels[pageIndex];
          if (!pageData) return null;

          const isCurrentPage = pageData.pageNumber === currentPage;

          return (
            <button
              key={pageData.pageNumber}
              onClick={() => handlePageClick(pageIndex)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium min-w-[160px] flex-shrink-0 ${
                isCurrentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={`${pageData.label} (${pageData.segmentCount} segments)`}
            >
              <div className="text-xs whitespace-nowrap">{pageData.label}</div>
              <div className="text-xs opacity-75">
                {pageData.segmentCount} segments
              </div>
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => {
          const currentIndex = getCurrentPageIndex();
          if (currentIndex < pageLabels.length - 1) {
            handlePageClick(currentIndex + 1);
          }
        }}
        disabled={!canGoNext}
        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex-shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TimePagination;