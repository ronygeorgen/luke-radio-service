import React from 'react';

const AudioPlayer = ({ segment, onClose }) => {
  if (!segment) return null;
  
  const fullSrc = `${import.meta.env.VITE_API_URL}/${segment.file_path}`;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div>
          <h3 className="font-semibold text-white text-lg truncate max-w-xs">
            {segment.title || 'Untitled Audio'}
          </h3>
          <p className="text-sm text-blue-100">
            {segment.duration_seconds}s • {new Date(segment.start_time).toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-blue-400 transition-colors duration-200"
          aria-label="Close audio player"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded audio controls */}
      <div className="p-4">
        <audio 
          controls
          autoPlay
          src={fullSrc}
          className="w-full h-12 [&::-webkit-media-controls-panel]:bg-gray-50 [&::-webkit-media-controls-panel]:rounded-lg"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};

export default AudioPlayer;