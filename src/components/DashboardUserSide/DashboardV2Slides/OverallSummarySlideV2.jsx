import { useEffect, useState } from 'react';
import { Lightbulb, Target, Users, Hand } from 'lucide-react';
import { dashboardApi } from '../../../services/dashboardApi';
import { convertUTCDateStringToLocal } from '../../../utils/dateTimeUtils';

const CARD_BG = { background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' };

function OverallSummarySlideV2({ dateRange = { start: null, end: null }, currentShiftId = '', reportFolderId = null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const channelId = localStorage.getItem('channelId');
    if (!reportFolderId && !channelId) {
      setError('Channel ID or Report Folder ID not found.');
      setLoading(false);
      return;
    }
    if (!dateRange?.start || !dateRange?.end) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const shiftId = currentShiftId ? parseInt(currentShiftId, 10) : null;

    dashboardApi
      .getSummary(dateRange.start, dateRange.end, channelId, shiftId, reportFolderId)
      .then(setData)
      .catch((err) => {
        setError(err.response?.data?.error || err.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [dateRange?.start, dateRange?.end, currentShiftId, reportFolderId]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-gray-700/50 rounded-lg mx-auto mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-6">
                <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse" />
                    <div className="h-5 w-32 bg-gray-600/50 rounded animate-pulse" />
                  </div>
                  <div className="w-48 h-48 mx-auto rounded-full border-[12px] border-gray-700/50 animate-pulse" />
                </div>
                <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-600/50 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-gray-600/50 rounded animate-pulse" />
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
        <p className="text-red-400 text-xl">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-white text-xl">No data available</p>
      </div>
    );
  }

  const sentimentChartData = (data.per_day_average_sentiments || []).map((item) => {
    const localDate = convertUTCDateStringToLocal(item.date);
    let dateObj;
    if (!localDate) {
      const [d, m, y] = item.date.split('/');
      dateObj = new Date(y, m - 1, d);
    } else {
      const [y, m, d] = localDate.split('-').map(Number);
      dateObj = new Date(y, m - 1, d);
    }
    return {
      month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
      value: item.average_sentiment,
      color: '#ffffff',
    };
  }).sort((a, b) => (a.month > b.month ? 1 : -1));

  const avg = data.average_sentiment ?? 0;
  const target = data.target_sentiment_score ?? 0;
  const low = data.low_sentiment ?? 0;
  const high = data.high_sentiment ?? 0;

  const donutR = 80;
  const donutC = 2 * Math.PI * donutR;
  const smallR = 56;
  const smallC = 2 * Math.PI * smallR;

  return (
    <div className="min-h-screen p-8 dashboard-slide-ready" data-dashboard-ready="true">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Overall Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left: Average Sentiment + Target */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Average Sentiment</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r={donutR} stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="none" />
                  <circle cx="96" cy="96" r={donutR} stroke="#14b8a6" strokeWidth="12" fill="none" strokeDasharray={`${(avg / 100) * donutC} ${donutC}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(avg)}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Target</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r={donutR} stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="none" />
                  <circle cx="96" cy="96" r={donutR} stroke="#14b8a6" strokeWidth="12" fill="none" strokeDasharray={`${(target / 100) * donutC} ${donutC}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(target)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Sentiment Analysis chart + Low/High */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Sentiment Analysis</h3>
              </div>
              <div className="h-48">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {[0, 20, 40, 60, 80, 100].map((v) => (
                    <line key={v} x1="40" y1={180 - v * 1.6} x2="380" y2={180 - v * 1.6} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  ))}
                  {sentimentChartData.length > 0 && (
                    <polyline
                      points={sentimentChartData.map((item, i) => {
                        const x = 40 + (i * 340) / Math.max(sentimentChartData.length - 1, 1);
                        const y = 180 - item.value * 1.6;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                  )}
                  {sentimentChartData.map((item, i) => {
                    const x = 40 + (i * 340) / Math.max(sentimentChartData.length - 1, 1);
                    const y = 180 - item.value * 1.6;
                    return <circle key={i} cx={x} cy={y} r="4" fill="#ffffff" />;
                  })}
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
                <h4 className="text-white font-semibold mb-1">Low Sentiment</h4>
                <p className="text-gray-400 text-sm mb-2">0-30</p>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r={smallR} stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                    <circle cx="64" cy="64" r={smallR} stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray={`${(low / 100) * smallC} ${smallC}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(low)}%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
                <h4 className="text-white font-semibold mb-1">High Sentiment</h4>
                <p className="text-gray-400 text-sm mb-2">60-100</p>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r={smallR} stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                    <circle cx="64" cy="64" r={smallR} stroke="#3b82f6" strokeWidth="8" fill="none" strokeDasharray={`${(high / 100) * smallC} ${smallC}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(high)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Total Talk Breaks + Segment Count */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Total Talk Breaks</h3>
              </div>
              <p className="text-4xl font-bold text-yellow-400">{data.total_talk_break ?? 0}</p>
              <p className="text-gray-400 text-sm">Segment Count: {data.segment_count ?? 0}</p>
              <div className="w-full h-2 rounded-full bg-gray-700/50 mt-2">
                <div className="h-2 rounded-full bg-white" style={{ width: `${Math.min((data.total_talk_break ?? 0) / 10, 100)}%` }} />
              </div>
            </div>

            <div className="rounded-2xl p-6 border border-gray-300/20" style={CARD_BG}>
              <div className="flex items-center gap-2 mb-4">
                <Hand className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Segment Count</h3>
              </div>
              <p className="text-4xl font-bold text-yellow-400">{data.segment_count ?? 0}</p>
              <p className="text-gray-400 text-sm">Total segments analyzed</p>
              <div className="w-full h-2 rounded-full bg-gray-700/50 mt-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min((data.segment_count ?? 0) / 10, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverallSummarySlideV2;
