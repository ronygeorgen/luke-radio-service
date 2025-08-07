import React from "react";
import AudioPlayer from "../AudioPlayer/AudioPlayer";


const RecognizedSegment = ({ segment }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-green-500">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-900">{segment.title || 'Unknown Title'}</h4>
          <p className="text-sm text-gray-500">
            {new Date(segment.start_time).toLocaleTimeString()} -{' '}
            {new Date(segment.end_time).toLocaleTimeString()} ({segment.duration_seconds}s)
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Recognized
        </span>
      </div>
      <div className="mt-3">
        <AudioPlayer src={segment.file_path} />
      </div>
    </div>
  );
};

export default RecognizedSegment;