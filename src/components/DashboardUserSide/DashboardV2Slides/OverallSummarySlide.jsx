import { useEffect, useState } from 'react';
import { Lightbulb, Target, Users, TrendingUp, Hand } from 'lucide-react';
import { dashboardApi } from '../../../services/dashboardApi';
import { convertUTCDateStringToLocal } from '../../../utils/dateTimeUtils';

const OverallSummarySlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [averageSentimentProgress, setAverageSentimentProgress] = useState(0);
  const [targetSentimentProgress, setTargetSentimentProgress] = useState(0);
  const [lowSentimentProgress, setLowSentimentProgress] = useState(0);
  const [highSentimentProgress, setHighSentimentProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);


  useEffect(() => {
    const fetchSummaryData = async () => {
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

        // API will handle UTC conversion internally
        const data = await dashboardApi.getSummary(
          dateRange.start,
          dateRange.end,
          channelId,
          shiftId
        );
        setSummaryData(data);

        // Reset and trigger animations with delay
        setIsVisible(false);
        setAverageSentimentProgress(0);
        setTargetSentimentProgress(0);
        setLowSentimentProgress(0);
        setHighSentimentProgress(0);

        const timer = setTimeout(() => {
          setIsVisible(true);

          // Animate progress bars from 0 to target values
          const animateProgress = (setter, target, duration = 1500) => {
            const startTime = Date.now();
            const animate = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min((elapsed / duration) * 100, 100);
              setter((target / 100) * progress);

              if (progress < 100) {
                requestAnimationFrame(animate);
              } else {
                setter(target);
              }
            };
            requestAnimationFrame(animate);
          };

          // Start animations with slight delays using real data
          const avgSentiment = data.average_sentiment || 0;
          const targetSentiment = data.target_sentiment_score || 0;
          const lowSentiment = data.low_sentiment || 0;
          const highSentiment = data.high_sentiment || 0;

          setTimeout(() => animateProgress(setAverageSentimentProgress, avgSentiment), 300);
          setTimeout(() => animateProgress(setTargetSentimentProgress, targetSentiment), 500);
          setTimeout(() => animateProgress(setLowSentimentProgress, lowSentiment), 700);
          setTimeout(() => animateProgress(setHighSentimentProgress, highSentiment), 900);
        }, 100);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch summary data');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [dateRange?.start, dateRange?.end, currentShiftId]);

  // Process sentiment data for chart display
  const processSentimentData = () => {
    if (!summaryData?.per_day_average_sentiments) {
      return [];
    }

    // Color palette for months
    const monthColors = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#a855f7', // Violet
    ];

    // Convert dates from DD/MM/YYYY to local timezone and format for display
    const processedData = summaryData.per_day_average_sentiments.map((item) => {
      const localDate = convertUTCDateStringToLocal(item.date);
      if (!localDate) {
        // Fallback: try to parse the date directly
        const [day, month, year] = item.date.split('/');
        const dateObj = new Date(year, month - 1, day);
        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
        const monthIndex = dateObj.getMonth();

        return {
          month: monthName,
          monthIndex: monthIndex,
          monthFull: dateObj.toLocaleDateString('en-US', { month: 'long' }),
          value: item.average_sentiment,
          date: localDate || item.date,
          color: monthColors[monthIndex]
        };
      }

      // Parse the local date and format for display
      const [year, month, day] = localDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const monthIndex = dateObj.getMonth();

      return {
        month: monthName,
        monthIndex: monthIndex,
        monthFull: dateObj.toLocaleDateString('en-US', { month: 'long' }),
        value: item.average_sentiment,
        date: localDate,
        color: monthColors[monthIndex]
      };
    });

    // Sort by date
    return processedData.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return 0;
    });
  };

  // Get unique months with their colors for legend
  const getMonthLegend = () => {
    const sentimentData = processSentimentData();
    const monthMap = new Map();

    sentimentData.forEach((item) => {
      if (!monthMap.has(item.monthFull)) {
        monthMap.set(item.monthFull, {
          name: item.monthFull,
          color: item.color,
          shortName: item.month
        });
      }
    });

    return Array.from(monthMap.values());
  };

  // Skeleton Loader Component
  const SummarySkeleton = () => (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-gray-700/50 rounded-lg mx-auto mb-8 animate-pulse"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column Skeleton */}
          <div className="space-y-6">
            {/* Average Sentiment Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <div className="w-48 h-48 rounded-full border-12 border-gray-700/50 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-12 bg-gray-600/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Target Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-20 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <div className="w-48 h-48 rounded-full border-12 border-gray-700/50 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-12 bg-gray-600/50 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column Skeleton */}
          <div className="space-y-6">
            {/* Sentiment Analysis Chart Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-36 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="h-48 bg-gray-700/30 rounded-lg animate-pulse relative overflow-hidden">
                {/* Simulate chart lines */}
                <svg viewBox="0 0 400 200" className="w-full h-full opacity-20">
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <line
                      key={val}
                      x1="40"
                      y1={180 - (val * 1.6)}
                      x2="380"
                      y2={180 - (val * 1.6)}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  <polyline
                    points="40,180 80,150 120,120 160,100 200,90 240,85 280,80 320,75 360,70 380,65"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Low/High Sentiment Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <div className="h-5 w-32 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
                <div className="relative w-32 h-32 mx-auto">
                  <div className="w-32 h-32 rounded-full border-8 border-gray-700/50 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-8 bg-gray-600/50 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <div className="h-5 w-36 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
                <div className="relative w-32 h-32 mx-auto">
                  <div className="w-32 h-32 rounded-full border-8 border-gray-700/50 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-8 bg-gray-600/50 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="space-y-6">
            {/* Total Talk Breaks Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-24 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-40 bg-gray-600/50 rounded mb-4 animate-pulse"></div>
              <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <div className="h-2 w-3/4 bg-gray-600/50 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Segment Count Skeleton */}
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="h-5 w-28 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
              <div className="h-12 w-24 bg-gray-600/50 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-36 bg-gray-600/50 rounded mb-4 animate-pulse"></div>
              <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <div className="h-2 w-2/3 bg-gray-600/50 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SummarySkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-white text-xl">No data available</div>
      </div>
    );
  }

  const sentimentData = processSentimentData();


  return (
    <div
      className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      data-loaded={!loading && !error && summaryData && isVisible ? 'true' : 'false'}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Overall Summary</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sentiment Overview */}
          <div
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Average Sentiment</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(averageSentimentProgress / 100) * 502.4} 502.4`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{
                      opacity: isVisible ? 1 : 0,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(averageSentimentProgress)}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Target</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(targetSentimentProgress / 100) * 502.4} 502.4`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{
                      opacity: isVisible ? 1 : 0,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(targetSentimentProgress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Sentiment Analysis */}
          <div
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Sentiment Analysis</h3>
              </div>
              <div className="h-48 relative">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {/* Y-axis labels */}
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <g key={val}>
                      <line
                        x1="40"
                        y1={180 - (val * 1.6)}
                        x2="380"
                        y2={180 - (val * 1.6)}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                      />
                      <text
                        x="35"
                        y={185 - (val * 1.6)}
                        textAnchor="end"
                        className="text-xs fill-gray-400"
                      >
                        {val}
                      </text>
                    </g>
                  ))}
                  {/* Animated Line chart */}
                  {sentimentData.length > 0 && (
                    <>
                      <polyline
                        points={sentimentData.map((item, index) => {
                          const x = 40 + (index * (340 / Math.max(sentimentData.length - 1, 1)));
                          const y = 180 - (item.value * 1.6);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeDasharray={isVisible ? "1000" : "0"}
                        strokeDashoffset={isVisible ? "0" : "1000"}
                        className="transition-all duration-1500 ease-out"
                        style={{ opacity: isVisible ? 1 : 0 }}
                      />
                      {/* Data points with animation */}
                      {sentimentData.map((item, index) => {
                        const x = 40 + (index * (340 / Math.max(sentimentData.length - 1, 1)));
                        const y = 180 - (item.value * 1.6);
                        // Check if date range is more than 7 days
                        const isMoreThan7Days = dateRange.start && dateRange.end &&
                          (new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24) > 7;

                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill={isMoreThan7Days ? item.color : "#ffffff"}
                              className="transition-all duration-500"
                              style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'scale(1)' : 'scale(0)',
                                transformOrigin: 'center',
                                transitionDelay: `${800 + index * 150}ms`,
                              }}
                            />
                            {/* Show colored spot on x-axis for more than 7 days, or month name for 7 days or less */}
                            {isMoreThan7Days ? (
                              <circle
                                cx={x}
                                cy="195"
                                r="3"
                                fill={item.color}
                                className="transition-all duration-500"
                                style={{
                                  opacity: isVisible ? 1 : 0,
                                  transitionDelay: `${1000 + index * 100}ms`,
                                }}
                              />
                            ) : (
                              <text
                                x={x}
                                y="195"
                                textAnchor="middle"
                                className="text-xs fill-gray-400 transition-opacity duration-500"
                                style={{
                                  opacity: isVisible ? 1 : 0,
                                  transitionDelay: `${1000 + index * 100}ms`,
                                }}
                              >
                                {item.month}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>
              {/* Month legend - only show when date range is more than 7 days */}
              {dateRange.start && dateRange.end &&
                (new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24) > 7 &&
                sentimentData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="flex flex-wrap items-center gap-3 justify-center">
                      {getMonthLegend().map((month, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: month.color }}
                          />
                          <span className="text-xs text-gray-300">{month.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <h4 className="text-white font-semibold mb-2">Low Sentiment (&lt;70)</h4>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(lowSentimentProgress / 100) * 351.86} 351.86`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      style={{
                        opacity: isVisible ? 1 : 0,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(lowSentimentProgress)}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <h4 className="text-white font-semibold mb-2">High Sentiment (95+)</h4>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(highSentimentProgress / 100) * 351.86} 351.86`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      style={{
                        opacity: isVisible ? 1 : 0,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(highSentimentProgress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - KPIs */}
          <div
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 600ms, transform 0.8s ease-out 600ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Total Talk Breaks</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{summaryData.total_talk_break || 0}</div>
              <p className="text-gray-400 text-sm mb-4">Segment Count: {summaryData.segment_count || 0}</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-white h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{
                    width: isVisible ? `${Math.min((summaryData.total_talk_break || 0) / 10, 100)}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '800ms',
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Hand className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Segment Count</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{summaryData.segment_count || 0}</div>
              <p className="text-gray-400 text-sm mb-4">Total segments analyzed</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{
                    width: isVisible ? `${Math.min((summaryData.segment_count || 0) / 10, 100)}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '1000ms',
                  }}
                />
              </div>
            </div>

            {/* <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Active Shifts</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{dummyData.activeShifts.value}</div>
              <p className="text-gray-400 text-sm mb-4">{dummyData.activeShifts.change} from last month</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{ 
                    width: isVisible ? `${dummyData.activeShifts.progress}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '1200ms',
                  }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-2 text-right">{dummyData.activeShifts.progress}%</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallSummarySlide;

