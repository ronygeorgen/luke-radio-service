import { useEffect, useState } from 'react';
import { dashboardApi } from '../../../services/dashboardApi';

const ImpactIndexSlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bucketData, setBucketData] = useState(null);

  // Fetch bucket count data
  useEffect(() => {
    const fetchBucketData = async () => {
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
        
        const data = await dashboardApi.getBucketCount(
          dateRange.start, 
          dateRange.end, 
          channelId, 
          shiftId
        );
        setBucketData(data);
        
        // Reset and trigger animations with delay
        setIsVisible(false);
        setRevealProgress(0);
        
        const timer = setTimeout(() => {
          setIsVisible(true);
          
          // Animate reveal progress from 0 to 100 over 2 seconds
          const startTime = Date.now();
          const duration = 2000;
          
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setRevealProgress(progress);
            
            if (progress < 100) {
              requestAnimationFrame(animate);
            }
          };
          
          requestAnimationFrame(animate);
        }, 100);
        
        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching bucket count data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch bucket count data');
      } finally {
        setLoading(false);
      }
    };

    fetchBucketData();
  }, [dateRange?.start, dateRange?.end, currentShiftId]);

  // Get categories dynamically from API response
  const getCategories = () => {
    if (!bucketData) {
      return [];
    }

    const categories = [];
    const categoryMap = {
      personal: { name: 'PERSONAL', color: '#14b8a6' },
      community: { name: 'COMMUNITY', color: '#fbbf24' },
      spiritual: { name: 'SPIRITUAL', color: '#3b82f6' }
    };

    // Check which categories exist in the data
    Object.keys(categoryMap).forEach(key => {
      if (bucketData[key] !== undefined) {
        categories.push({
          key,
          name: categoryMap[key].name,
          color: categoryMap[key].color,
          percentage: bucketData[key]?.percentage || 0
        });
      }
    });

    return categories;
  };

  // Process monthly breakdown data for trends chart
  const processMonthlyTrends = () => {
    if (!bucketData?.monthly_breakdown) {
      return {
        data: {},
        months: [],
        categories: []
      };
    }

    const monthlyData = bucketData.monthly_breakdown;
    const categories = getCategories();
    
    // Get all months from monthly_breakdown and filter only those with data
    // The API already returns monthly_breakdown filtered for the selected period
    const monthsWithData = Object.keys(monthlyData).filter((monthKey) => {
      const monthData = monthlyData[monthKey];
      return monthData && monthData.total > 0;
    });

    // Sort months chronologically (oldest to newest)
    const sortedMonths = monthsWithData.sort();
    
    const months = [];
    const categoryData = {};
    
    // Initialize category data arrays
    categories.forEach(cat => {
      categoryData[cat.key] = [];
    });

    sortedMonths.forEach((monthKey) => {
      const monthData = monthlyData[monthKey];
      
      // Format month for display (e.g., "2025-10" -> "Oct")
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      months.push(monthName);
      
      // Add data for each category
      categories.forEach(cat => {
        categoryData[cat.key].push(monthData[cat.key]?.percentage || 0);
      });
    });

    return {
      data: categoryData,
      months,
      categories
    };
  };

  // Get circles data from API (using dynamic categories)
  const getCirclesData = () => {
    const categories = getCategories();
    
    if (categories.length === 0) {
      return [
        { name: 'PERSONAL', value: 0, color: '#14b8a6' },
        { name: 'COMMUNITY', value: 0, color: '#fbbf24' },
        { name: 'SPIRITUAL', value: 0, color: '#3b82f6' },
      ];
    }

    return categories.map(cat => ({
      name: cat.name,
      value: Math.round(cat.percentage || 0),
      color: cat.color
    }));
  };

  // Generate insights from data
  const generateInsights = () => {
    if (!bucketData) {
      return [
        'No data available for the selected date range.',
      ];
    }

    const insights = [];
    const total = bucketData.total || 0;
    const categories = getCategories();

    if (total > 0 && categories.length > 0) {
      // Find top category
      const topCategory = categories.reduce((max, cat) => 
        cat.percentage > max.percentage ? cat : max
      );
      
      insights.push(
        `Total of ${total.toLocaleString()} segments analyzed across all impact categories.`
      );
      
      insights.push(
        `${topCategory.name} impact represents the largest share at ${Math.round(topCategory.percentage)}% of total segments.`
      );

      // Add insights for other significant categories
      const otherCategories = categories
        .filter(cat => cat.key !== topCategory.key && cat.percentage > 0)
        .sort((a, b) => b.percentage - a.percentage);
      
      if (otherCategories.length > 0) {
        const secondCategory = otherCategories[0];
        insights.push(
          `${secondCategory.name} content accounts for ${Math.round(secondCategory.percentage)}% of segments.`
        );
      }
    } else {
      insights.push('No segments found for the selected date range and filters.');
    }

    return insights;
  };


  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-gray-700/50 rounded-lg mx-auto mb-8 animate-pulse"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="h-6 w-32 bg-gray-600/50 rounded mb-6 animate-pulse"></div>
                <div className="h-64 bg-gray-700/30 rounded-lg animate-pulse"></div>
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
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  const circlesData = getCirclesData();
  const trendsData = processMonthlyTrends();
  const insights = generateInsights();

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Impact Index</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Circles of Wellbeing */}
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">Circles of Wellbeing</h3>
            <div className="relative w-64 h-64 mx-auto">
              <svg className="transform -rotate-90 w-64 h-64">
                {[...circlesData].reverse().map((circle, index) => {
                  const startAngle = (index * 120) - 90;
                  const endAngle = ((index + 1) * 120) - 90;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const radius = 100;
                  const x1 = 128 + radius * Math.cos(startRad);
                  const y1 = 128 + radius * Math.sin(startRad);
                  const x2 = 128 + radius * Math.cos(endRad);
                  const y2 = 128 + radius * Math.sin(endRad);
                  const largeArc = 120 > 180 ? 1 : 0;
                  const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;

                  return (
                    <g key={circle.name}>
                      <path
                        d={`M 128 128 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={circle.color}
                        className="transition-all duration-1000"
                        style={{ 
                          opacity: isVisible ? 1 : 0,
                          transitionDelay: `${index * 200}ms`
                        }}
                      />
                      <text
                        x={128 + (radius * 0.7) * Math.cos(midAngle)}
                        y={128 + (radius * 0.7) * Math.sin(midAngle)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-2xl font-bold fill-white transition-opacity duration-1000"
                        transform={`rotate(90 ${128 + (radius * 0.7) * Math.cos(midAngle)} ${128 + (radius * 0.7) * Math.sin(midAngle)})`}
                        style={{ 
                          opacity: isVisible ? 1 : 0,
                          transitionDelay: `${index * 200 + 300}ms`
                        }}
                      >
                        {circle.value}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-6 space-y-3">
              {circlesData.map((circle, index) => (
                <div 
                  key={circle.name} 
                  className="flex items-center justify-between transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                    transitionDelay: `${index * 100 + 800}ms`,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: circle.color }} />
                    <span className="text-white font-medium">{circle.name}</span>
                  </div>
                  <span className="text-white font-semibold">{circle.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Panel - Circle Trends */}
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">Circle Trends</h3>
            <div className="h-80 relative">
              {trendsData.months.length > 0 && trendsData.categories.length > 0 ? (
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  {/* Y-axis */}
                  <line x1="40" y1="20" x2="40" y2="280" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  {/* X-axis */}
                  <line x1="40" y1="280" x2="380" y2="280" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((val) => (
                    <line
                      key={val}
                      x1="40"
                      y1={280 - (val * 2.6)}
                      x2="380"
                      y2={280 - (val * 2.6)}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Stacked area chart with wave animation */}
                  {(() => {
                    const points = trendsData.months.map((month, monthIndex) => {
                      const x = 40 + (monthIndex * (340 / Math.max(trendsData.months.length - 1, 1)));
                      
                      // Calculate cumulative Y positions for stacked areas (from bottom to top)
                      let cumulativeY = 280;
                      const categoryYs = {};
                      
                      // Process categories in order to build cumulative stack
                      trendsData.categories.forEach(cat => {
                        const value = trendsData.data[cat.key][monthIndex] || 0;
                        const y = cumulativeY - (value * 2.6);
                        categoryYs[cat.key] = { y, value, cumulativeY };
                        cumulativeY = y; // Update cumulative for next category
                      });
                      
                      return { x, month, categoryYs };
                    });

                    // Create paths for each category (stacked from bottom to top)
                    const categoryPaths = trendsData.categories.map((cat, catIndex) => {
                      if (catIndex === 0) {
                        // Bottom category - path from x-axis (280) to its Y values
                        const topPath = points.map(p => `${p.x},${p.categoryYs[cat.key].y}`).join(' ');
                        return `M ${points[0].x},280 L ${topPath} L ${points[points.length - 1].x},280 Z`;
                      } else {
                        // Upper categories - path from previous category's Y to this category's Y
                        const prevCat = trendsData.categories[catIndex - 1];
                        const topPath = points.map(p => `${p.x},${p.categoryYs[cat.key].y}`).join(' ');
                        const bottomPath = [...points].reverse().map(p => `${p.x},${p.categoryYs[prevCat.key].y}`).join(' ');
                        return `M ${points[0].x},${points[0].categoryYs[prevCat.key].y} L ${topPath} L ${bottomPath} Z`;
                      }
                    });

                    const revealWidth = (revealProgress / 100) * 400;
                    
                    return (
                      <g>
                        {/* Clip path for left-to-right reveal animation */}
                        <defs>
                          <clipPath id="chartReveal">
                            <rect
                              x="0"
                              y="0"
                              width={revealWidth}
                              height="300"
                            />
                          </clipPath>
                        </defs>
                        
                        {/* Render categories from bottom to top */}
                        {trendsData.categories.map((cat, index) => (
                          <g key={cat.key} clipPath="url(#chartReveal)">
                            <path
                              d={categoryPaths[index]}
                              fill={cat.color}
                              opacity={0.8}
                            />
                          </g>
                        ))}
                        
                        {/* Month labels - appear as wave passes */}
                        {points.map((point, index) => {
                          const labelProgress = ((point.x - 40) / 340) * 100;
                          const isLabelVisible = revealProgress >= labelProgress;
                          return (
                            <text
                              key={index}
                              x={point.x}
                              y="295"
                              textAnchor="middle"
                              className="text-xs fill-white"
                              style={{
                                opacity: isLabelVisible ? 1 : 0,
                                transition: 'opacity 0.2s ease-out',
                              }}
                            >
                              {point.month}
                            </text>
                          );
                        })}
                      </g>
                    );
                  })()}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                  No trend data available
                </div>
              )}
              
              {/* Legend for categories */}
              {trendsData.categories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex flex-wrap items-center gap-4 justify-center">
                    {trendsData.categories.map((cat, index) => (
                      <div 
                        key={cat.key} 
                        className="flex items-center space-x-2 transition-all duration-700"
                        style={{
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                          transitionDelay: `${index * 100}ms`,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs text-white font-medium">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Key Insight */}
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 600ms, transform 0.8s ease-out 600ms',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">Key Insight</h3>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white/10 rounded-lg p-4 border border-white/20 transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${index * 200}ms`,
                  }}
                >
                  <p className="text-white text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactIndexSlide;
