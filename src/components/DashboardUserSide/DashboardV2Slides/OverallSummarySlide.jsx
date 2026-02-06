import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Lightbulb, Target, Users, Hand } from 'lucide-react';
import { dashboardApi } from '../../../services/dashboardApi';
import { convertUTCDateStringToLocal } from '../../../utils/dateTimeUtils';

const CARD_BG = { background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' };

const OverallSummarySlide = ({ dateRange = { start: null, end: null, selecting: false }, currentShiftId = '', reportFolderId = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const channelId = localStorage.getItem('channelId');
    if (!reportFolderId && !channelId) {
      setError('Channel ID or Report Folder ID not found. Please select a channel or report folder first.');
      setLoading(false);
      return;
    }
    if (!dateRange?.start || !dateRange?.end) {
      setLoading(false);
      return;
    }

    const id = fetchIdRef.current + 1;
    fetchIdRef.current = id;
    setLoading(true);
    setError(null);

    const shiftId = currentShiftId ? parseInt(currentShiftId, 10) : null;
    dashboardApi
      .getSummary(dateRange.start, dateRange.end, channelId, shiftId, reportFolderId)
      .then((data) => {
        if (fetchIdRef.current !== id) return;
        setSummaryData(data);
      })
      .catch((err) => {
        if (fetchIdRef.current !== id) return;
        console.error('Error fetching summary data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch summary data');
      })
      .finally(() => {
        if (fetchIdRef.current === id) setLoading(false);
      });

    return () => {
      fetchIdRef.current = id + 1;
    };
  }, [dateRange?.start, dateRange?.end, currentShiftId, reportFolderId]);

  // Mark ready for PDF only after layout has been painted (avoids capturing before cards are visible)
  useLayoutEffect(() => {
    if (loading || error || !summaryData) {
      setIsFullyLoaded(false);
      return;
    }
    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setIsFullyLoaded(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [loading, error, summaryData]);

  const processSentimentData = () => {
    if (!summaryData?.per_day_average_sentiments) return [];

    const monthColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
      '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7',
    ];

    return summaryData.per_day_average_sentiments.map((item) => {
      const localDate = convertUTCDateStringToLocal(item.date);
      let dateObj;
      if (!localDate) {
        const [day, month, year] = item.date.split('/');
        dateObj = new Date(year, month - 1, day);
      } else {
        const [year, month, day] = localDate.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      }
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const monthIndex = dateObj.getMonth();
      const monthFull = dateObj.toLocaleDateString('en-US', { month: 'long' });

      return {
        month: monthName,
        monthIndex,
        monthFull,
        value: item.average_sentiment,
        date: localDate || item.date,
        color: monthColors[monthIndex],
      };
    }).sort((a, b) => (a.date && b.date ? new Date(a.date) - new Date(b.date) : 0));
  };

  const getMonthLegend = () => {
    const sentimentData = processSentimentData();
    const monthMap = new Map();
    sentimentData.forEach((item) => {
      if (!monthMap.has(item.monthFull)) {
        monthMap.set(item.monthFull, { name: item.monthFull, color: item.color, shortName: item.month });
      }
    });
    return Array.from(monthMap.values());
  };

  // Skeleton while loading
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-gray-700/50 rounded-lg mx-auto mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-6">
                <div className="rounded-2xl p-6 shadow-xl border border-gray-300/20" style={CARD_BG}>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse" />
                    <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse" />
                  </div>
                  <div className="w-48 h-48 mx-auto rounded-full border-[12px] border-gray-700/50 animate-pulse" />
                </div>
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

  if (!summaryData) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-white text-xl">No data available</div>
      </div>
    );
  }

  const sentimentData = processSentimentData();
  const avgSentiment = summaryData.average_sentiment ?? 0;
  const targetSentiment = summaryData.target_sentiment_score ?? 0;
  const lowSentiment = summaryData.low_sentiment ?? 0;
  const highSentiment = summaryData.high_sentiment ?? 0;
  const isMoreThan7Days = dateRange.start && dateRange.end &&
    (new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24) > 7;

  const DonutCircle = ({ value }) => {
    const cx = 96;
    const r = 80;
    const circumference = 2 * Math.PI * r;
    const dash = (value / 100) * circumference;
    return (
      <svg className="transform -rotate-90 w-48 h-48" viewBox="0 0 192 192">
        <circle cx={cx} cy={cx} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="none" />
        <circle cx={cx} cy={cx} r={r} stroke="#14b8a6" strokeWidth="12" fill="none" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
    );
  };

  const SmallDonut = ({ value }) => {
    const r = 56;
    const circumference = 2 * Math.PI * r;
    const dash = (value / 100) * circumference;
    return (
      <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
        <circle cx="64" cy="64" r={r} stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div
      className={`min-h-screen p-8 ${isFullyLoaded ? 'dashboard-slide-ready' : ''}`}
      data-loaded="true"
      data-dashboard-ready={isFullyLoaded ? 'true' : undefined}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Overall Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6 min-w-0">
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Average Sentiment</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <DonutCircle value={avgSentiment} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(avgSentiment)}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Target</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <DonutCircle value={targetSentiment} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(targetSentiment)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle column */}
          <div className="space-y-6 min-w-0">
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Sentiment Analysis</h3>
              </div>
              <div className="h-48 relative">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <g key={val}>
                      <line x1="40" y1={180 - (val * 1.6)} x2="380" y2={180 - (val * 1.6)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      <text x="35" y={185 - (val * 1.6)} textAnchor="end" className="text-xs fill-gray-400">{val}</text>
                    </g>
                  ))}
                  {sentimentData.length > 0 && (
                    <>
                      <polyline
                        points={sentimentData.map((item, i) => {
                          const x = 40 + (i * (340 / Math.max(sentimentData.length - 1, 1)));
                          const y = 180 - (item.value * 1.6);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                      {sentimentData.map((item, i) => {
                        const x = 40 + (i * (340 / Math.max(sentimentData.length - 1, 1)));
                        const y = 180 - (item.value * 1.6);
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill={isMoreThan7Days ? item.color : '#ffffff'} />
                            {isMoreThan7Days ? (
                              <circle cx={x} cy="195" r="3" fill={item.color} />
                            ) : (
                              <text x={x} y="195" textAnchor="middle" className="text-xs fill-gray-400">{item.month}</text>
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>
              {isMoreThan7Days && sentimentData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="flex flex-wrap items-center gap-3 justify-center">
                    {getMonthLegend().map((month, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: month.color }} />
                        <span className="text-xs text-gray-300">{month.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={CARD_BG}>
                <h4 className="text-white font-semibold mb-1">Low Sentiment</h4>
                <p className="text-gray-400 text-sm mb-2">
                  {summaryData?.thresholds?.low_sentiment_range
                    ? `${summaryData.thresholds.low_sentiment_range.min_lower}-${summaryData.thresholds.low_sentiment_range.min_upper}`
                    : '0-30'}
                </p>
                <div className="relative w-32 h-32 mx-auto">
                  <SmallDonut value={lowSentiment} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(lowSentiment)}%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={CARD_BG}>
                <h4 className="text-white font-semibold mb-1">High Sentiment</h4>
                <p className="text-gray-400 text-sm mb-2">
                  {summaryData?.thresholds?.high_sentiment_range
                    ? `${summaryData.thresholds.high_sentiment_range.max_lower}-${summaryData.thresholds.high_sentiment_range.max_upper}`
                    : '60-100'}
                </p>
                <div className="relative w-32 h-32 mx-auto">
                  <SmallDonut value={highSentiment} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(highSentiment)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 min-w-0">
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Total Talk Breaks</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{summaryData.total_talk_break ?? 0}</div>
              <p className="text-gray-400 text-sm mb-4">Segment Count: {summaryData.segment_count ?? 0}</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div className="bg-white h-2 rounded-full" style={{ width: `${Math.min((summaryData.total_talk_break ?? 0) / 10, 100)}%` }} />
              </div>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center space-x-2 mb-4">
                <Hand className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Segment Count</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{summaryData.segment_count ?? 0}</div>
              <p className="text-gray-400 text-sm mb-4">Total segments analyzed</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((summaryData.segment_count ?? 0) / 10, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallSummarySlide;
