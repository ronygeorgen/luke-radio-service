import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPieChartData } from '../../store/slices/audioSegmentsSlice';
import { X, Eye, Loader2 } from 'lucide-react';

const PieChartModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { pieChartData, pieChartLoading, pieChartError } = useSelector((state) => state.audioSegments);
  const filters = useSelector((state) => state.audioSegments.filters);

  const [chartData, setChartData] = useState([]);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [popOutIndex, setPopOutIndex] = useState(null);
  const svgContainerRef = useRef(null);
  const tooltipRef = useRef(null);

  // Category colors mapping
  const categoryColors = {
    music: '#10B981', // Green
    recognised_not_music: '#3B82F6', // Blue
    unrecognised_with_content: '#F59E0B', // Amber
    unrecognised_active_without_content: '#8B5CF6', // Purple
    unrecognised_not_active: '#EF4444' // Red
  };

  // Category display names
  const categoryDisplayNames = {
    music: 'Music',
    recognised_not_music: 'Recognized (Not Music)',
    unrecognised_with_content: 'Unrecognized (With Content)',
    unrecognised_active_without_content: 'Unrecognized (Active)',
    unrecognised_not_active: 'Unrecognized (Not Active)'
  };

 // In PieChartModal, use the current page's time range
useEffect(() => {
  if (isOpen) {
    const channelId = localStorage.getItem("channelId");

    // Get current page data from Redux
    const currentPageData = useSelector((state) => state.audioSegments.pagination?.current_page);
    const availablePages = useSelector((state) => state.audioSegments.pagination?.available_pages);
    
    let pageTimeRange = null;
    if (currentPageData && availablePages) {
      const pageInfo = availablePages.find(page => page.page === currentPageData);
      if (pageInfo) {
        pageTimeRange = {
          startTime: pageInfo.start_time,
          endTime: pageInfo.end_time
        };
      }
    }

    const params = {
      channelId,
      // Use page time range if available, otherwise use filters
      ...(pageTimeRange ? {
        startTime: pageTimeRange.startTime,
        endTime: pageTimeRange.endTime
      } : {
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        startTime: filters.startTime,
        endTime: filters.endTime,
        daypart: filters.daypart
      })
    };

    dispatch(fetchPieChartData(params));
  }
}, [isOpen, dispatch, filters]);

  useEffect(() => {
    if (pieChartData && pieChartData.length > 0) {
      // Process the data to create continuous segments
      const processedData = processChartData(pieChartData);
      setChartData(processedData);
    }
  }, [pieChartData]);

  const processChartData = (apiData) => {
    // Sort by start time to ensure chronological order
    const sortedData = [...apiData].sort((a, b) => a.value[0] - b.value[0]);
    
    // Create continuous segments array with proper cumulative positioning
    const segments = [];
    let cumulativePercentage = 0;
    
    sortedData.forEach((item, index) => {
      const [start, end] = item.value;
      const duration = end - start;
      const percentage = (duration / 3600) * 100;
      
      segments.push({
        ...item,
        duration,
        displayTitle: item.title === 'undefined' ? 'Unknown' : item.title,
        color: categoryColors[item.category] || '#6B7280',
        percentage: percentage,
        startPercentage: cumulativePercentage,
        endPercentage: cumulativePercentage + percentage
      });
      
      cumulativePercentage += percentage;
    });

    return segments;
  };

  const handleSvgMouseMove = (event) => {
    if (!tooltipRef.current) return;
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let x = event.clientX + 15;
    let y = event.clientY - tooltipRect.height - 10;
    
    // Ensure tooltip stays within viewport
    if (x + tooltipRect.width > window.innerWidth) {
      x = event.clientX - tooltipRect.width - 15;
    }
    if (y < 0) {
      y = event.clientY + 15;
    }
    
    setTooltipPosition({ x, y });
  };

  const handleSegmentMouseEnter = (segment, index) => {
    setHoveredSegment(segment);
    setPopOutIndex(index);
  };

  const handleSegmentMouseLeave = () => {
    setHoveredSegment(null);
    setPopOutIndex(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTimeDisplay = () => {
    if (filters.date && filters.startTime && filters.endTime) {
      const dateObj = new Date(filters.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const startTime = filters.startTime.substring(0, 5);
      const endTime = filters.endTime.substring(0, 5);
      return `${formattedDate} • ${startTime} - ${endTime}`;
    } else if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const endDate = new Date(filters.endDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      return `${startDate} - ${endDate}`;
    }
    return 'Selected period';
  };

  // Calculate category totals for legend
  const categoryTotals = chartData.reduce((acc, segment) => {
    if (!acc[segment.category]) {
      acc[segment.category] = {
        duration: 0,
        count: 0,
        displayName: categoryDisplayNames[segment.category] || segment.category,
        color: segment.color
      };
    }
    acc[segment.category].duration += segment.duration;
    acc[segment.category].count += 1;
    return acc;
  }, {});

  // Function to create arc path for each segment with pop-out effect
  const createArcPath = (startPercent, endPercent, isPoppedOut = false) => {
    const radius = isPoppedOut ? 45 : 40; // Larger radius for popped out segments
    const startAngle = (startPercent / 100) * 2 * Math.PI;
    const endAngle = (endPercent / 100) * 2 * Math.PI;
    
    const x1 = 60 + radius * Math.cos(startAngle - Math.PI / 2);
    const y1 = 60 + radius * Math.sin(startAngle - Math.PI / 2);
    const x2 = 60 + radius * Math.cos(endAngle - Math.PI / 2);
    const y2 = 60 + radius * Math.sin(endAngle - Math.PI / 2);
    
    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
    
    return `M 60 60 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Eye className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Content Distribution</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {pieChartLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <span className="ml-3 text-lg text-gray-600">Loading chart data...</span>
            </div>
          ) : pieChartError ? (
            <div className="text-center py-16 text-red-500 text-lg">
              Failed to load chart data: {pieChartError}
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-lg">
              No data available for the selected time period
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              
              {/* Pie Chart */}
              <div className="flex-1 min-w-0 flex justify-center items-center">
                <div
                  ref={svgContainerRef}
                  className="relative w-96 h-96"
                  onMouseMove={handleSvgMouseMove}
                  onMouseLeave={handleSegmentMouseLeave}
                >
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full overflow-visible"
                  >
                    {/* Background circle for better visual appearance */}
                    <circle
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="4"
                    />
                    
                    {/* Individual segments as paths - with pop-out effect */}
                    {chartData.map((segment, index) => {
                      const isPoppedOut = popOutIndex === index;
                      return (
                        <path
                          key={index}
                          d={createArcPath(segment.startPercentage, segment.endPercentage, isPoppedOut)}
                          fill={segment.color}
                          className={`transition-all duration-300 cursor-pointer stroke-white stroke-1 ${
                            isPoppedOut 
                              ? 'filter drop-shadow-lg' 
                              : 'hover:opacity-90'
                          }`}
                          style={{
                            transform: isPoppedOut ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                          onMouseEnter={() => handleSegmentMouseEnter(segment, index)}
                          onMouseLeave={handleSegmentMouseLeave}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Legend and Details */}
              <div className="flex-1 min-w-0 w-full">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(categoryTotals).map(([category, data]) => {
                      const percentage = ((data.duration / 3600) * 100).toFixed(1);
                      
                      return (
                        <div
                          key={category}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-300 cursor-pointer group"
                          onMouseEnter={() =>
                            handleSegmentMouseEnter({
                              category,
                              displayName: data.displayName,
                              duration: data.duration,
                              count: data.count,
                              color: data.color,
                              percentage: percentage,
                              formattedDuration: formatTime(data.duration)
                            }, null)
                          }
                          onMouseLeave={handleSegmentMouseLeave}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div
                              className="w-5 h-5 rounded flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                              style={{ backgroundColor: data.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-base font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {data.displayName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {data.count} segment{data.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {formatTime(data.duration)}
                            </div>
                            <div className="text-sm text-gray-500">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(categoryTotals).length}
                    </div>
                    <div className="text-sm text-blue-800">Content Categories</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors duration-300">
                    <div className="text-2xl font-bold text-green-600">
                      {chartData.length}
                    </div>
                    <div className="text-sm text-green-800">Total Segments</div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-300">
                  <h4 className="font-semibold text-gray-900 mb-2">Distribution Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Largest Category:</span>
                      <span className="font-semibold">
                        {Object.keys(categoryTotals).length > 0 
                          ? Object.entries(categoryTotals).reduce((a, b) => a[1].duration > b[1].duration ? a : b)[1].displayName 
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Most Segments:</span>
                      <span className="font-semibold">
                        {Object.keys(categoryTotals).length > 0 
                          ? Object.entries(categoryTotals).reduce((a, b) => a[1].count > b[1].count ? a : b)[1].displayName 
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-1">Time Period:</div>
            <div>{formatDateTimeDisplay()}</div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredSegment && (
        <div
          ref={tooltipRef}
          className="fixed pointer-events-none z-[9999] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm min-w-[160px] transition-all duration-200 animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div className="font-semibold mb-1 text-center">
            {hoveredSegment.displayTitle || hoveredSegment.displayName}
          </div>
          <div className="flex items-center justify-center space-x-2 mb-1">
            <div
              className="w-3 h-3 rounded flex-shrink-0"
              style={{ backgroundColor: hoveredSegment.color }}
            />
            <span>{hoveredSegment.formattedDuration}</span>
          </div>
          <div className="text-xs text-center text-gray-300">
            {hoveredSegment.percentage}%{hoveredSegment.count && ` • ${hoveredSegment.count} segments`}
          </div>
          {hoveredSegment.category && (
            <div className="text-xs text-center text-gray-400 mt-1">
              {categoryDisplayNames[hoveredSegment.category]}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PieChartModal;