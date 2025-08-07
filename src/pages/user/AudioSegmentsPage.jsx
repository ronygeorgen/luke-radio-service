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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Audio Segments - {channel_info?.channel_name || 'Channel'}
        </h2>
      </div>

      <DateHourFilter />

      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => dispatch(toggleRecognizedFilter())}
          className={`px-4 py-2 rounded-md ${
            filters.showRecognized
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Recognized ({recognized.length})
        </button>
        <button
          onClick={() => dispatch(toggleUnrecognizedFilter())}
          className={`px-4 py-2 rounded-md ${
            filters.showUnrecognized
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Unrecognized ({unrecognized.length})
        </button>
      </div>

      <div className="space-y-4">
        {filters.showRecognized &&
          recognized.map((segment) => (
            <RecognizedSegment key={segment.file_name} segment={segment} />
          ))}

        {filters.showUnrecognized &&
          unrecognized.map((segment) => (
            <UnrecognizedSegment key={segment.file_name} segment={segment} />
          ))}

        {recognized.length === 0 &&
          unrecognized.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audio segments found for the selected filters.
            </div>
          )}
      </div>
    </div>
  );
};

export default AudioSegmentsPage;