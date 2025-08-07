import React from 'react';
import { useNavigate } from 'react-router-dom';
import AudioPlayer from '../AudioPlayer/AudioPlayer';

const UnrecognizedSegment = ({ segment }) => {
  const navigate = useNavigate();

  const handleViewMore = () => {
    navigate(`/unrecognized-audio/${segment.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-yellow-500">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-900">Unrecognized Audio</h4>
          <p className="text-sm text-gray-500">
            {new Date(segment.start_time).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })} -{' '}
            {new Date(segment.end_time).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })} ({segment.duration_seconds}s)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Before: {segment.title_before || 'Unknown'} | After: {segment.title_after || 'Unknown'}
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Unrecognized
        </span>
      </div>
      <div className="mt-3">
        <AudioPlayer src={segment.file_path} />
      </div>
      <button
        onClick={handleViewMore}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
      >
        View Details →
      </button>
    </div>
  );
};

export default UnrecognizedSegment;