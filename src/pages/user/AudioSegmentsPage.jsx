import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchAudioSegments } from '../../store/slices/audioSegmentsSlice';
import { toggleRecognizedFilter, toggleUnrecognizedFilter } from '../../store/slices/audioSegmentsSlice';
import DateHourFilter from '../../components/DateHourFilter/DateHourFilter';
import RecognizedSegment from '../../components/AudioSegment/RecognizedSegment';
import UnrecognizedSegment from '../../components/AudioSegment/UnrecognizedSegment';

const AudioSegmentsPage = () => {
  const { channelId } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const {
    data: { recognized, unrecognized, channel_info },
    loading,
    error,
    filters,
  } = useSelector((state) => state.audioSegments);

  useEffect(() => {
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0].replace(/-/g, '');
    const hour = searchParams.get('hour') || '0';
    
    dispatch(fetchAudioSegments({ channelId, date, hour }));
  }, [channelId, searchParams, dispatch]);

  useEffect(() => {
    if (channelId && filters.date && filters.hour !== undefined) {
      dispatch(fetchAudioSegments({ channelId, date: filters.date, hour: filters.hour }));
    }
  }, [channelId, filters.date, filters.hour, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Audio Segments - {channel_info?.channel_name || 'Channel'}
          </h2>
          <p className="text-gray-500 text-lg">Browse and filter audio segments for this channel.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-wrap items-end gap-6 mb-10 border border-gray-200">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={
                filters.date
                  ? `${filters.date.substring(0, 4)}-${filters.date.substring(4, 6)}-${filters.date.substring(6, 8)}`
                  : ''
              }
              max={new Date().toISOString().split('T')[0]}
              onChange={e => {
                const newDate = e.target.value.replace(/-/g, '');
                dispatch({ type: 'audioSegments/setDateFilter', payload: newDate });
              }}
            />
          </div>

          {/* Hour Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hour</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.hour}
              onChange={e => dispatch({ type: 'audioSegments/setHourFilter', payload: e.target.value })}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
              ))}
            </select>
          </div>

          {/* Recognized Toggle */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Show</label>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(toggleRecognizedFilter())}
                className={`px-4 py-2 rounded-full border transition font-semibold text-sm ${
                  filters.showRecognized
                    ? 'bg-green-500 text-white border-green-500 shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                }`}
              >
                Recognized ({recognized.length})
              </button>
              <button
                onClick={() => dispatch(toggleUnrecognizedFilter())}
                className={`px-4 py-2 rounded-full border transition font-semibold text-sm ${
                  filters.showUnrecognized
                    ? 'bg-yellow-500 text-white border-yellow-500 shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-50'
                }`}
              >
                Unrecognized ({unrecognized.length})
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="ml-auto">
            <button
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold border border-gray-300"
              onClick={() => {
                dispatch({ type: 'audioSegments/setDateFilter', payload: new Date().toISOString().split('T')[0].replace(/-/g, '') });
                dispatch({ type: 'audioSegments/setHourFilter', payload: '0' });
                if (!filters.showRecognized) dispatch(toggleRecognizedFilter());
                if (!filters.showUnrecognized) dispatch(toggleUnrecognizedFilter());
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Segment List */}
        <div className="grid gap-6">
          {filters.showRecognized && recognized.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-green-700 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Recognized Segments
              </h3>
              <div className="grid gap-4">
                {recognized.map(segment => (
                  <RecognizedSegment key={segment.file_name} segment={segment} />
                ))}
              </div>
            </div>
          )}
          {filters.showUnrecognized && unrecognized.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-yellow-700 mb-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Unrecognized Segments
              </h3>
              <div className="grid gap-4">
                {unrecognized.map(segment => (
                  <UnrecognizedSegment key={segment.file_name} segment={segment} />
                ))}
              </div>
            </div>
          )}
          {recognized.length === 0 && unrecognized.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-lg">
              No audio segments found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioSegmentsPage;