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
  const svgContainerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const channelId = localStorage.getItem("channelId");

      const params = {
        channelId,
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        startTime: filters.startTime,
        endTime: filters.endTime,
        daypart: filters.daypart
      };

      dispatch(fetchPieChartData(params));
    }
  }, [isOpen, dispatch, filters]);

  useEffect(() => {
    if (pieChartData && pieChartData.length > 0) {
      const processedData = pieChartData.reduce((acc, item) => {
        const title = item.title === 'undefined' ? 'Unknown' : item.title;
        const existing = acc.find(i => i.title === title);

        if (existing) {
          existing.value += item.value;
        } else {
          acc.push({ ...item, title });
        }
        return acc;
      }, []);
      setChartData(processedData);
    }
  }, [pieChartData]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const generateColors = (count) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1'
    ];
    return colors.slice(0, count);
  };

  const colors = generateColors(chartData.length);

  const handleSvgMouseMove = (event) => {
    if (!tooltipRef.current) return;
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let x = event.clientX + 15;
    let y = event.clientY - tooltipRect.height - 10;
    setTooltipPosition({ x, y });
  };

  const handleSegmentMouseEnter = (segment) => setHoveredSegment(segment);
  const handleSvgMouseLeave = () => setHoveredSegment(null);

  const formatDateTimeDisplay = () => {
    if (filters.date && filters.startTime && filters.endTime) {
      const dateObj = new Date(filters.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const startTime = filters.startTime.substring(0, 5);
      const endTime = filters.endTime.substring(0, 5);
      return `${formattedDate} • ${startTime} - ${endTime}`;
    }
    return 'Selected period';
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
                  onMouseLeave={handleSvgMouseLeave}
                >
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full transform -rotate-90 overflow-visible"
                  >
                    {chartData.map((item, index) => {
                      const percentage = (item.value / total) * 100;
                      const strokeDasharray = `${percentage} 100`;
                      const strokeDashoffset = chartData
                        .slice(0, index)
                        .reduce((sum, prevItem) => sum + (prevItem.value / total) * 100, 0);

                      return (
                        <circle
                          key={item.title}
                          cx="60"
                          cy="60"
                          r="40"
                          fill="none"
                          stroke={colors[index]}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-200 hover:stroke-[24px] cursor-pointer"
                          onMouseEnter={() =>
                            handleSegmentMouseEnter({
                              ...item,
                              index,
                              percentage: percentage.toFixed(1)
                            })
                          }
                          onMouseLeave={() => setHoveredSegment(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{total}</div>
                      <div className="text-sm text-gray-500">Total Minutes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 min-w-0 w-full">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Breakdown</h3>
                  <div className="space-y-3">
                    {chartData.map((item, index) => {
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return (
                        <div
                          key={item.title}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div
                              className="w-5 h-5 rounded flex-shrink-0"
                              style={{ backgroundColor: colors[index] }}
                            />
                            <span
                              className="text-base font-medium text-gray-900 truncate"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-base font-semibold text-gray-900">
                              {item.value}m
                            </div>
                            <div className="text-sm text-gray-500">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{chartData.length}</div>
                    <div className="text-sm text-blue-800">Content Types</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{total}</div>
                    <div className="text-sm text-green-800">Total Minutes</div>
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

      {/* Tooltip (fixed on screen, not clipped or overlapping) */}
      {hoveredSegment && (
        <div
          ref={tooltipRef}
          className="fixed pointer-events-none z-[9999] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm min-w-[140px]"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div className="font-semibold mb-1 text-center">{hoveredSegment.title}</div>
          <div className="flex items-center justify-center space-x-2">
            <div
              className="w-3 h-3 rounded flex-shrink-0"
              style={{ backgroundColor: colors[hoveredSegment.index] }}
            />
            <span>{hoveredSegment.value}m ({hoveredSegment.percentage}%)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChartModal;
