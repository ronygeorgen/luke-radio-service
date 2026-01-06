// TranscriptionLogModal.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Calendar, Clock } from 'lucide-react';
import { axiosInstance } from '../services/api';

const TranscriptionLogModal = ({ isOpen, onClose }) => {
  const { channels } = useSelector(state => state.channels);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Set default dates to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      // Select all channels by default
      setSelectedChannels(channels.map(ch => ch.id));
      setData(null);
      setError(null);
    }
  }, [isOpen, channels]);

  const handleChannelToggle = (channelId) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChannels.length === channels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(channels.map(ch => ch.id));
    }
  };

  const formatDateTimeForAPI = (date, time) => {
    if (!date) return null;
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(`${date}T${hours}:${minutes}:00`);
    return dateTime.toISOString();
  };

  const handleFetch = async () => {
    if (selectedChannels.length === 0) {
      setError('Please select at least one channel');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDateTime = formatDateTimeForAPI(startDate, startTime);
      const endDateTime = formatDateTimeForAPI(endDate, endTime);

      const channelsParam = selectedChannels.join(',');
      const url = `/logger/rev-transcription-job-logs/statistics/?channels=${channelsParam}&start_time=${startDateTime}&end_time=${endDateTime}`;

      const response = await axiosInstance.get(url);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch transcription logs');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            View Transcription Log
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Channels
            </label>
            <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 mb-2 font-medium"
              >
                {selectedChannels.length === channels.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="space-y-2">
                {channels.map(channel => (
                  <label key={channel.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => handleChannelToggle(channel.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {channel.name || `Channel ${channel.channelId}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date & Time
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date & Time
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Fetch Button */}
          <div className="flex justify-end">
            <button
              onClick={handleFetch}
              disabled={loading || selectedChannels.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Fetch Logs</span>
                </>
              )}
            </button>
          </div>

          {/* Results Table */}
          {data && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcription Statistics</h3>
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channel Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.channels && data.channels.length > 0 ? (
                      data.channels.map((channel) => (
                        <tr key={channel.channel_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {channel.channel_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {formatDuration(channel.total_duration_seconds)}
                            <span className="text-gray-500 ml-2">
                              ({channel.total_duration_seconds.toFixed(2)}s)
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-4 py-3 text-center text-sm text-gray-500">
                          No data available for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {data.grand_total !== undefined && (
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          Grand Total
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatDuration(data.grand_total)}
                          <span className="text-gray-600 ml-2">
                            ({data.grand_total.toFixed(2)}s)
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionLogModal;

