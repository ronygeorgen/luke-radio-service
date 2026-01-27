import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { dashboardApi } from '../../../services/dashboardApi';

const TopTopicsSlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '', reportFolderId = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [topTopicsByDuration, setTopTopicsByDuration] = useState([]);
  const [topTopicsByCount, setTopTopicsByCount] = useState([]);
  const [blockingTopic, setBlockingTopic] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch top topics data
  useEffect(() => {
    const fetchTopTopics = async () => {
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

        const shiftId = currentShiftId ? parseInt(currentShiftId, 10) : null;

        // Fetch both datasets in parallel
        const [durationData, countData] = await Promise.all([
          dashboardApi.getTopTopics(
            dateRange.start,
            dateRange.end,
            channelId,
            'duration',
            shiftId,
            showAllTopics,
            reportFolderId
          ),
          dashboardApi.getTopTopics(
            dateRange.start,
            dateRange.end,
            channelId,
            'count',
            shiftId,
            showAllTopics,
            reportFolderId
          )
        ]);

        // Process duration data - get top 10 and calculate percentages
        const durationTopics = (durationData.top_topics || []).slice(0, 10);
        const totalDuration = durationTopics.reduce((sum, topic) => sum + (topic.total_duration_seconds || 0), 0);
        const processedDuration = durationTopics.map(topic => ({
          name: topic.topic_name,
          count: topic.count,
          duration: topic.total_duration_seconds,
          durationFormatted: topic.total_duration_formatted,
          percentage: totalDuration > 0 ? Math.round((topic.total_duration_seconds / totalDuration) * 100) : 0
        }));

        // Process count data - get top 10
        const countTopics = (countData.top_topics || []).slice(0, 10);
        const processedCount = countTopics.map(topic => ({
          name: topic.topic_name,
          count: topic.count,
          duration: topic.total_duration_seconds,
          durationFormatted: topic.total_duration_formatted
        }));

        setTopTopicsByDuration(processedDuration);
        setTopTopicsByCount(processedCount);

        // Reset and trigger animations with delay
        setIsVisible(false);

        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 100);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error fetching top topics:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch top topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopTopics();
  }, [dateRange?.start, dateRange?.end, currentShiftId, showAllTopics, refreshKey, reportFolderId]);

  const handleTopicClick = (topic, event) => {
    // Get the bounding rectangle of the clicked element
    const rect = event.currentTarget.getBoundingClientRect();

    // Calculate position: absolute based on scroll + element position
    // We want it "just above", so subtract modal height (approx) + offset
    setModalPosition({
      top: rect.top + window.scrollY - 10, // 10px gap above the element
      left: rect.left + window.scrollX + (rect.width / 2), // Center horizontally relative to element
    });
    setBlockingTopic(topic);
  };

  const handleBlockConfirm = async () => {
    if (!blockingTopic) return;

    try {
      const channelId = localStorage.getItem('channelId');
      if (!channelId) return;

      const payload = [{
        topic_name: blockingTopic.name,
        is_active: false,
        channel_id: parseInt(channelId, 10)
      }];

      await dashboardApi.updateGeneralTopics(payload);
      setBlockingTopic(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error blocking topic:', error);
      alert('Failed to block topic');
    }
  };

  const handleToggleShowAllTopics = () => {
    setShowAllTopics(!showAllTopics);
  };

  // Calculate max count for proper scaling
  const maxTopicCount = topTopicsByCount.length > 0
    ? Math.max(...topTopicsByCount.map(topic => topic.count))
    : 1;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-64 bg-gray-300/50 rounded-lg animate-pulse mx-auto"></div>
            <div className="h-6 w-40 bg-gray-300/50 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel Skeleton */}
            <div className="bg-teal-100 rounded-2xl p-4 shadow-xl">
              <div className="h-5 w-48 bg-teal-200/50 rounded mb-3 animate-pulse"></div>
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-teal-200/50 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-3.5 w-32 bg-teal-200/50 rounded mb-1 animate-pulse"></div>
                      <div className="w-full bg-teal-200/50 rounded-full h-1.5 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right Panel Skeleton */}
            <div className="bg-teal-100 rounded-2xl p-4 shadow-xl">
              <div className="h-5 w-40 bg-gray-300/50 rounded mb-3 animate-pulse"></div>
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-teal-200/50 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-3.5 w-32 bg-teal-200/50 rounded mb-1 animate-pulse"></div>
                      <div className="w-full bg-teal-200/50 rounded-full h-1.5 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
      className={`min-h-screen p-4 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      data-loaded={!loading && !error && isVisible ? 'true' : 'false'}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Top Topics Distribution</h2>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Top 10 Topics (Time) */}
          <div
            className="bg-teal-100 rounded-2xl p-4 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">Top 10 Topics (Time)</h3>
            <div className="space-y-1.5">
              {topTopicsByDuration.length === 0 ? (
                <p className="text-gray-700 text-center py-4 text-sm">No data available</p>
              ) : (
                topTopicsByDuration.map((topic, index) => {
                  const baseDelay = 200 + (index * 100);
                  return (
                    <div
                      key={topic.name}
                      className="flex items-center space-x-3 transition-all duration-700 cursor-pointer hover:bg-teal-200 p-1.5 rounded-lg"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                        transitionDelay: `${baseDelay}ms`,
                      }}
                      onClick={(e) => handleTopicClick(topic, e)}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 border-2 border-teal-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium text-sm">{topic.name}</span>
                            <span className="text-gray-600 text-xs">{topic.percentage}%</span>
                          </div>
                          <span className="text-gray-700 text-xs">{topic.durationFormatted}</span>
                        </div>
                        <div className="w-full bg-teal-200 rounded-full h-1.5">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{
                              width: isVisible ? `${topic.percentage}%` : '0%',
                              transitionDelay: `${baseDelay + 200}ms`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Top 10 Topics # */}
          <div
            className="bg-teal-100 rounded-2xl p-4 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Top 10 Topics #</h3>
            </div>
            <div className="space-y-1.5">
              {topTopicsByCount.length === 0 ? (
                <p className="text-gray-700 text-center py-4 text-sm">No data available</p>
              ) : (
                topTopicsByCount.map((topic, index) => {
                  const baseDelay = 400 + (index * 100);
                  const percentage = maxTopicCount > 0 ? Math.round((topic.count / maxTopicCount) * 100) : 0;
                  return (
                    <div
                      key={topic.name}
                      className="flex items-center space-x-3 transition-all duration-700 cursor-pointer hover:bg-teal-200 p-1.5 rounded-lg"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                        transitionDelay: `${baseDelay}ms`,
                      }}
                      onClick={(e) => handleTopicClick(topic, e)}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 border-2 border-teal-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-900 font-medium text-sm">{topic.name}</span>
                          <span className="text-gray-700 text-xs">{topic.count}</span>
                        </div>
                        <div className="w-full bg-teal-200 rounded-full h-1.5">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{
                              width: isVisible ? `${percentage}%` : '0%',
                              transitionDelay: `${baseDelay + 200}ms`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Block Topic Confirmation Modal */}
      {blockingTopic && (
        <>
          {/* Transparent backdrop to catch clicks outside */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setBlockingTopic(null)}
          />

          {/* Popover Modal */}
          <div
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 transform -translate-x-1/2 -translate-y-full"
            style={{
              top: modalPosition.top,
              left: modalPosition.left,
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 mb-1">Block Topic?</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Block <span className="font-semibold">{blockingTopic.name}</span>?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setBlockingTopic(null)}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBlockConfirm}
                    className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopTopicsSlide;


