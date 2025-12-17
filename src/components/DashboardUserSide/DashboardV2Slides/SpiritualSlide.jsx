import { useEffect, useState } from 'react';
import { RefreshCw, User } from 'lucide-react';
import { dashboardApi } from '../../../services/dashboardApi';

const SpiritualSlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryData, setCategoryData] = useState(null);

  // Color palette for buckets
  const bucketColors = {
    'MENTAL': '#8b5cf6',
    'PHYSICAL': '#3b82f6',
    'FINANCIAL': '#10b981',
    'LEARNING': '#f59e0b',
    'PURPOSE': '#ec4899',
    'ATMOSPHERE': '#000000',
    'RELATIONSHIPS': '#1e3a8a',
    'FUN': '#14b8a6',
    'GENEROSITY': '#ef4444',
    'CHRISTIAN PRACTICES': '#6366f1', // Changed from white to indigo
    'CHRISTIAN COMMUNITY': '#3b82f6',
    'FAITH JOURNEY': '#000000',
  };

  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, category: '', value: '' });

  // Fetch category bucket data
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const channelId = localStorage.getItem('channelId');
        if (!channelId) {
          setError('Channel ID not found. Please select a channel first.');
          setLoading(false);
          return;
        }
        
        if (!dateRange || !dateRange.start || !dateRange.end) {
          setLoading(false);
          return;
        }
        
        const shiftId = currentShiftId ? parseInt(currentShiftId, 10) : null;
        
        const data = await dashboardApi.getCategoryBucketCount(
          dateRange.start, 
          dateRange.end, 
          channelId, 
          'spiritual',
          shiftId
        );
        setCategoryData(data);
        
        // Reset and trigger animations with delay
        setIsVisible(false);
        
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 100);
        
        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching category bucket data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch category data');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [dateRange?.start, dateRange?.end, currentShiftId]);

  // Process buckets data for display
  const processBucketsData = () => {
    if (!categoryData?.buckets) {
      return {
        byContentNumber: [],
        byContentTime: [],
        totalTime: []
      };
    }

    const buckets = categoryData.buckets;
    const bucketEntries = Object.entries(buckets);
    
    // Sort by percentage (descending)
    const sortedBuckets = bucketEntries.sort((a, b) => (b[1].percentage || 0) - (a[1].percentage || 0));

    const byContentNumber = sortedBuckets.map(([name, data]) => ({
      name,
      value: Math.round(data.percentage || 0)
    }));

    const byContentTime = sortedBuckets.map(([name, data]) => ({
      name,
      value: Math.round(data.percentage || 0),
      color: bucketColors[name] || '#3b82f6'
    }));

    // Total Time data - use duration_seconds, convert to minutes for display
    const totalTime = sortedBuckets.map(([name, data]) => ({
      category: name,
      value: Math.round((data.duration_seconds || 0) / 60) // Convert seconds to minutes
    }));

    return {
      byContentNumber,
      byContentTime,
      totalTime
    };
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-gray-300/50 rounded-lg mx-auto mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="h-6 w-32 bg-gray-300/50 rounded mb-6 animate-pulse"></div>
                <div className="h-64 bg-gray-200/50 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-red-600 text-xl">Error: {error}</div>
      </div>
    );
  }

  const bucketsData = processBucketsData();
  const total = categoryData?.total || 0;

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">SPIRITUAL</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - By Content # */}
          <div 
            className="bg-amber-100 rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <RefreshCw className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">By Content #</h3>
            </div>
            {bucketsData.byContentNumber.length > 0 ? (
              <div className="space-y-4">
                {bucketsData.byContentNumber.map((item, index) => (
                  <div
                    key={item.name}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
                      transition: `opacity 0.6s ease-out ${index * 150 + 200}ms, transform 0.6s ease-out ${index * 150 + 200}ms`,
                    }}
                  >
                    <div
                      className="flex items-center justify-between mb-2"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transition: `opacity 0.5s ease-out ${index * 150 + 300}ms`,
                      }}
                    >
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                    </div>
                    <div className="w-full bg-blue-500 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-3 rounded-full origin-left"
                        style={{
                          width: isVisible ? `${item.value}%` : '0%',
                          transition: `width 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${index * 150 + 500}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No data available</div>
            )}
          </div>

          {/* Middle Panel - By Content Time */}
          <div 
            className="bg-amber-100 rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">By Content Time</h3>
            </div>
            {bucketsData.byContentTime.length > 0 ? (
              <div className="relative pl-8">
                {/* Chart area - bars start from 0% level */}
                <div className="h-64 relative">
                  {/* Y-axis labels on the left */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-8">
                    <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0 }}>25%</span>
                    <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '100ms' }}>20%</span>
                    <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '200ms' }}>15%</span>
                    <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '300ms' }}>10%</span>
                    <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '400ms' }}>5%</span>
                    <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '500ms' }}>0%</span>
                  </div>

                  {/* Chart area with bars - bars start from 0% level */}
                  <div className="ml-8 h-full flex items-end justify-between space-x-2">
                    {bucketsData.byContentTime.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex-1 flex flex-col items-center h-full justify-end"
                        style={{
                          opacity: isVisible ? 1 : 0,
                          transition: `opacity 0.3s ease-out ${index * 100 + 200}ms`,
                        }}
                      >
                        {/* Vertical bar - water filling animation from bottom to top */}
                        <div
                          className="w-full rounded-t origin-bottom overflow-hidden cursor-pointer"
                          style={{
                            height: isVisible ? `${(item.value / 25) * 100}%` : '0%',
                            backgroundColor: item.color,
                            transition: `height 1.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 200 + 400}ms`,
                            minHeight: '2px',
                            position: 'relative',
                          }}
                          onMouseEnter={() => {
                            setTooltip({
                              show: true,
                              x: 0,
                              y: 0,
                              category: item.name,
                              value: `${item.value}%`
                            });
                          }}
                          onMouseMove={(e) => {
                            setTooltip(prev => ({
                              ...prev,
                              x: e.clientX,
                              y: e.clientY
                            }));
                          }}
                          onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, category: '', value: '' })}
                        >
                          {/* Water filling effect overlay */}
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                            style={{
                              opacity: isVisible ? 0.3 : 0,
                              transition: `opacity 0.5s ease-out ${index * 200 + 1900}ms`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* X-axis colored spots - positioned at the 0% level */}
                <div className="ml-8 mt-2 flex justify-between space-x-2">
                  {bucketsData.byContentTime.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex-1 flex flex-col items-center"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transition: `opacity 0.3s ease-out ${index * 150 + 1000}ms`,
                      }}
                    >
                      {/* Colored spot */}
                      <div
                        className="w-3 h-3 rounded-full mb-1"
                        style={{ backgroundColor: item.color }}
                      />
                      {/* Percentage value */}
                      <span className="text-xs font-bold text-gray-900">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
                {/* Category legend */}
                <div className="ml-8 mt-4 pt-4 border-t border-gray-300">
                  <div className="flex flex-wrap items-center gap-3 justify-center">
                    {bucketsData.byContentTime.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No data available</div>
            )}
          </div>

          {/* Right Panel - Total Time */}
          <div 
            className="bg-amber-100 rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 600ms, transform 0.8s ease-out 600ms',
            }}
          >
            <h3 className="text-lg font-bold text-red-600 mb-6">Total Time</h3>
            {bucketsData.totalTime.length > 0 ? (
              <>
                <div className="relative pl-2">
                  {/* Chart area - graph starts from 0 level */}
                  <div className="h-72 relative">
                    <div className="w-full h-full">
                      <svg viewBox="0 0 440 260" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                        {/* Calculate max value for scaling */}
                        {(() => {
                          const maxValue = Math.max(...bucketsData.totalTime.map(item => item.value), 1);
                          // Round up to nice intervals for minutes
                          let roundedMax;
                          if (maxValue <= 10) {
                            roundedMax = 10;
                          } else if (maxValue <= 50) {
                            roundedMax = Math.ceil(maxValue / 10) * 10;
                          } else if (maxValue <= 100) {
                            roundedMax = Math.ceil(maxValue / 20) * 20;
                          } else if (maxValue <= 500) {
                            roundedMax = Math.ceil(maxValue / 50) * 50;
                          } else {
                            roundedMax = Math.ceil(maxValue / 100) * 100;
                          }
                          
                          // Generate Y-axis values
                          const yAxisValues = [];
                          const step = roundedMax <= 10 ? 2 : roundedMax <= 50 ? 10 : roundedMax <= 100 ? 20 : roundedMax <= 500 ? 50 : 100;
                          for (let i = 0; i <= roundedMax; i += step) {
                            yAxisValues.push(i);
                          }
                          if (yAxisValues[yAxisValues.length - 1] < roundedMax) {
                            yAxisValues.push(roundedMax);
                          }

                          return (
                            <>
                              {/* Y-axis labels */}
                              {yAxisValues.map((value, idx) => {
                                const y = 20 + (roundedMax - value) / roundedMax * 180;
                                return (
                                  <text
                                    key={`y-label-${value}`}
                                    x="32"
                                    y={y}
                                    dy="4"
                                    textAnchor="end"
                                    className="text-xs fill-gray-500 transition-opacity duration-500"
                                    style={{
                                      opacity: isVisible ? 1 : 0,
                                      transitionDelay: `${idx * 100}ms`,
                                      fontSize: '12px',
                                      fontWeight: '500'
                                    }}
                                  >
                                    {value}
                                  </text>
                                );
                              })}

                              {/* X-axis / 0% baseline - solid line at bottom */}
                              <line
                                x1="40"
                                y1="200"
                                x2="420"
                                y2="200"
                                stroke="#9ca3af"
                                strokeWidth="2"
                                className="transition-opacity duration-500"
                                style={{
                                  opacity: isVisible ? 1 : 0,
                                  transitionDelay: '0ms',
                                }}
                              />

                              {/* Horizontal grid lines for other intervals */}
                              {yAxisValues.filter(v => v > 0).map((value, idx) => {
                                const y = 20 + (roundedMax - value) / roundedMax * 180;
                                return (
                                  <line
                                    key={`grid-${value}`}
                                    x1="40"
                                    y1={y}
                                    x2="420"
                                    y2={y}
                                    stroke="#d1d5db"
                                    strokeWidth="1"
                                    strokeDasharray="4,4"
                                    className="transition-opacity duration-500"
                                    style={{
                                      opacity: isVisible ? 1 : 0,
                                      transitionDelay: `${(idx + 1) * 50}ms`,
                                    }}
                                  />
                                );
                              })}

                              {/* Line chart - waterfall animation from left to right */}
                              <polyline
                                points={bucketsData.totalTime.map((item, index) => {
                                  const x = 40 + (index * (380 / Math.max(bucketsData.totalTime.length - 1, 1)));
                                  const y = 20 + (roundedMax - item.value) / roundedMax * 180;
                                  return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="3"
                                strokeDasharray="1000"
                                strokeDashoffset={isVisible ? "0" : "1000"}
                                style={{
                                  transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  transitionDelay: '500ms',
                                }}
                              />

                              {/* Data points - waterfall animation with tooltips */}
                              {bucketsData.totalTime.map((item, index) => {
                                const x = 40 + (index * (380 / Math.max(bucketsData.totalTime.length - 1, 1)));
                                const y = 20 + (roundedMax - item.value) / roundedMax * 180;
                                const baseDelay = 500 + (index * 250);
                                const categoryColor = bucketColors[item.category] || '#3b82f6';
                                return (
                                  <g key={`point-${index}`}>
                                    {/* Invisible larger circle for hover area */}
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="8"
                                      fill="transparent"
                                      style={{ cursor: 'pointer' }}
                                      onMouseEnter={(e) => {
                                        setTooltip({
                                          show: true,
                                          x: 0,
                                          y: 0,
                                          category: item.category,
                                          value: `${item.value} min`
                                        });
                                      }}
                                      onMouseMove={(e) => {
                                        setTooltip(prev => ({
                                          ...prev,
                                          x: e.clientX,
                                          y: e.clientY
                                        }));
                                      }}
                                      onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, category: '', value: '' })}
                                    />
                                    {/* Visible data point */}
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r={isVisible ? "4" : "0"}
                                      fill={categoryColor}
                                      style={{
                                        opacity: isVisible ? 1 : 0,
                                        transition: `opacity 0.3s ease-out ${baseDelay}ms, r 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${baseDelay}ms`,
                                      }}
                                    />
                                  </g>
                                );
                              })}

                              {/* X-axis colored spots */}
                              {bucketsData.totalTime.map((item, index) => {
                                const x = 40 + (index * (380 / Math.max(bucketsData.totalTime.length - 1, 1)));
                                const baseDelay = 500 + (index * 250);
                                const categoryColor = bucketColors[item.category] || '#3b82f6';
                                return (
                                  <circle
                                    key={`x-spot-${index}`}
                                    cx={x}
                                    cy="200"
                                    r="3"
                                    fill={categoryColor}
                                    className="transition-all duration-500"
                                    style={{
                                      opacity: isVisible ? 1 : 0,
                                      transitionDelay: `${baseDelay + 200}ms`,
                                    }}
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Category legend */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex flex-wrap items-center gap-3 justify-center">
                    {bucketsData.totalTime.map((item, index) => {
                      const categoryColor = bucketColors[item.category] || '#3b82f6';
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span className="text-xs text-gray-600">{item.category}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">No data available</div>
            )}
            <div className="space-y-3 mt-8">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Segments</span>
                <span className="text-xl font-bold text-gray-900 bg-purple-200 rounded-lg px-4 py-2">{total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Duration</span>
                <span className="text-xl font-bold text-gray-900 bg-purple-200 rounded-lg px-4 py-2">
                  {categoryData?.total_filtered_duration_hours 
                    ? `${Math.round(categoryData.total_filtered_duration_hours * 100) / 100} hours`
                    : '0 hours'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 65}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">{tooltip.category}</div>
          <div className="text-gray-300">{tooltip.value}</div>
        </div>
      )}
    </div>
  );
};

export default SpiritualSlide;
