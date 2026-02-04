import { useEffect, useState } from 'react';
import { Radio, Mic, Heart } from 'lucide-react';
import { dashboardApi } from '../../../services/dashboardApi';

const EntityComparisonSlide = ({ dateRange = { start: null, end: null, selecting: false }, reportFolderId = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  // Fetch shifts and topics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const channelId = localStorage.getItem('channelId');
        if (!reportFolderId && !channelId) {
          setError('Channel ID or Report Folder ID not found. Please select a channel or report folder first.');
          setLoading(false);
          return;
        }

        if (!dateRange || !dateRange.start || !dateRange.end) {
          setLoading(false);
          return;
        }

        // Fetch topics data by shift
        const data = await dashboardApi.getGeneralTopicCountByShift(
          dateRange.start,
          dateRange.end,
          channelId,
          showAllTopics,
          reportFolderId
        );

        // Use shifts directly from API response
        if (data.shifts && Array.isArray(data.shifts)) {
          setShifts(data.shifts);
        } else {
          setShifts([]);
        }

        // Reset and trigger animations with delay
        setIsVisible(false);

        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 100);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching entity comparison data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch entity comparison data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange?.start, dateRange?.end, showAllTopics, reportFolderId]);

  // Mark slide as fully loaded (data + animations done) for PDF capture — backend waits for .dashboard-slide-ready
  useEffect(() => {
    if (loading || error || !isVisible) {
      setIsFullyLoaded(false);
      return;
    }
    const t = setTimeout(() => setIsFullyLoaded(true), 3000);
    return () => clearTimeout(t);
  }, [loading, error, isVisible]);

  const handleToggleShowAllTopics = () => {
    setShowAllTopics(!showAllTopics);
  };

  // Calculate max values for proper scaling
  const maxContentNumber = shifts.length > 0
    ? Math.max(...shifts.map(shift => shift.total_count || 0))
    : 1;
  const maxAvgSentiment = shifts.length > 0
    ? Math.max(...shifts.map(shift => shift.average_sentiment || 0))
    : 1;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-10 w-64 bg-gray-300/50 rounded-lg animate-pulse"></div>
            <div className="h-6 w-40 bg-gray-300/50 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-5 h-5 bg-gray-300/50 rounded animate-pulse"></div>
                  <div className="h-6 w-32 bg-gray-300/50 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-300/50 rounded-full animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-300/50 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-12 bg-gray-300/50 rounded animate-pulse"></div>
                        <div className="w-16 h-2 bg-gray-200/50 rounded-full animate-pulse"></div>
                        <div className="h-4 w-8 bg-gray-300/50 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-5 h-5 bg-gray-300/50 rounded animate-pulse"></div>
                  <div className="h-6 w-32 bg-gray-300/50 rounded animate-pulse"></div>
                </div>
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'} ${isFullyLoaded ? 'dashboard-slide-ready' : ''}`}
      data-loaded={!loading && !error && isVisible ? 'true' : 'false'}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Entity Comparison</h2>

          {/* Toggle Button for Show All Topics */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-700 font-medium">Show All Topics</span>
            <button
              onClick={handleToggleShowAllTopics}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showAllTopics ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              role="switch"
              aria-checked={showAllTopics}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAllTopics ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className="text-xs text-gray-500">
              {showAllTopics ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {/* Top Section - Shift Cards with Topics */}
        {shifts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {shifts.map((shift, shiftIndex) => {
              const shiftTopics = shift.topics || [];
              const shiftTotalCount = shift.total_count || 0;

              return (
                <div
                  key={shift.shift_id || shiftIndex}
                  className="bg-white rounded-2xl p-4 shadow-xl transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${shiftIndex * 100}ms`,
                  }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <Radio className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold text-gray-900">{shift.shift_name || `Shift ${shiftIndex + 1}`}</h3>
                  </div>

                  {/* Shift Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Topics</div>
                      <div className="text-sm font-bold text-gray-900">{shift.total_topics || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="text-sm font-bold text-gray-900">{shiftTotalCount.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Sentiment</div>
                      <div className="text-sm font-bold text-gray-900">
                        {shift.average_sentiment ? Math.round(shift.average_sentiment) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {shiftTopics.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No topics available</p>
                    ) : (
                      shiftTopics.map((topic, topicIndex) => {
                        const percentage = shiftTotalCount > 0 ? Math.round((topic.count / shiftTotalCount) * 100) : 0;
                        return (
                          <div
                            key={`${shift.shift_id}-${topicIndex}`}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${topicIndex < 3 ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 border-2 border-blue-500'
                                }`}>
                                {topicIndex + 1}
                              </span>
                              <span className="text-sm text-gray-700 truncate" title={topic.topic_name}>
                                {topic.topic_name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-sm text-gray-600">({topic.count})</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                  style={{
                                    width: isVisible ? `${percentage}%` : '0%',
                                    transitionDelay: `${(shiftIndex * 100) + (topicIndex * 50)}ms`
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <p className="text-gray-600 text-center">No shifts available</p>
          </div>
        )}

        {/* Bottom Section - Summary Charts */}
        {shifts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Content # */}
            <div
              className="bg-white rounded-2xl p-6 shadow-xl"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
                transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
              }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <Mic className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900">By Content #</h3>
              </div>
              <div className="h-64 relative">
                <div className="absolute inset-0 flex items-end justify-between space-x-4 px-2">
                  {shifts.map((shift, index) => {
                    const colors = ['#ec4899', '#10b981', '#fbbf24', '#3b82f6'];
                    const baseDelay = 200 + (index * 150);
                    const value = shift.total_count || 0;
                    const barHeight = maxContentNumber > 0 ? (value / maxContentNumber) * 100 : 0;
                    return (
                      <div
                        key={shift.shift_id || index}
                        className="flex-1 flex flex-col items-center h-full"
                        style={{
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                          transition: `opacity 0.5s ease-out ${baseDelay}ms, transform 0.5s ease-out ${baseDelay}ms`,
                        }}
                      >
                        <div className="flex flex-col items-center justify-end h-full w-full pb-16">
                          <div
                            className="w-full rounded-t origin-bottom"
                            style={{
                              height: isVisible ? `${barHeight}%` : '0%',
                              minHeight: isVisible ? '8px' : '0px',
                              backgroundColor: colors[index % colors.length],
                              transition: `height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms, min-height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms`,
                            }}
                          />
                          <span
                            className="text-xs text-gray-600 mt-2 text-center transition-opacity duration-300 truncate w-full"
                            style={{
                              opacity: isVisible ? 1 : 0,
                              transitionDelay: `${baseDelay + 800}ms`,
                            }}
                            title={shift.shift_name}
                          >
                            {shift.shift_name}
                          </span>
                          <span
                            className="text-xs font-bold text-gray-900 mt-1 transition-opacity duration-300"
                            style={{
                              opacity: isVisible ? 1 : 0,
                              transitionDelay: `${baseDelay + 800}ms`,
                            }}
                          >
                            {value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* By Avg Sentiment */}
            <div
              className="bg-white rounded-2xl p-6 shadow-xl"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
                transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
              }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900">By Avg Sentiment</h3>
              </div>
              <div className="h-64 relative">
                <div className="absolute inset-0 flex items-end justify-between space-x-4 px-2">
                  {shifts.map((shift, index) => {
                    const colors = ['#ec4899', '#10b981', '#fbbf24', '#3b82f6'];
                    const baseDelay = 400 + (index * 150);
                    const value = shift.average_sentiment || 0;
                    const barHeight = maxAvgSentiment > 0 ? (value / maxAvgSentiment) * 100 : 0;
                    return (
                      <div
                        key={shift.shift_id || index}
                        className="flex-1 flex flex-col items-center h-full"
                        style={{
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                          transition: `opacity 0.5s ease-out ${baseDelay}ms, transform 0.5s ease-out ${baseDelay}ms`,
                        }}
                      >
                        <div className="flex flex-col items-center justify-end h-full w-full pb-16">
                          <div
                            className="w-full rounded-t origin-bottom"
                            style={{
                              height: isVisible ? `${barHeight}%` : '0%',
                              minHeight: isVisible ? '8px' : '0px',
                              backgroundColor: colors[index % colors.length],
                              transition: `height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms, min-height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms`,
                            }}
                          />
                          <span
                            className="text-xs text-gray-600 mt-2 text-center transition-opacity duration-300 truncate w-full"
                            style={{
                              opacity: isVisible ? 1 : 0,
                              transitionDelay: `${baseDelay + 800}ms`,
                            }}
                            title={shift.shift_name}
                          >
                            {shift.shift_name}
                          </span>
                          <span
                            className="text-xs font-bold text-gray-900 mt-1 transition-opacity duration-300"
                            style={{
                              opacity: isVisible ? 1 : 0,
                              transitionDelay: `${baseDelay + 800}ms`,
                            }}
                          >
                            {Math.round(value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityComparisonSlide;
