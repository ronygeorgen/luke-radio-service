import React from 'react';

const AudioPlayer = ({ segment, onClose }) => {
  if (!segment) return null;
  console.log('AudioPlayer segment:', segment.file_path);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={onClose}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div>
          <h3 className="font-medium text-gray-900">{segment.title || 'Untitled Audio'}</h3>
          <p className="text-sm text-gray-500">
            {segment.duration_seconds}s • {new Date(segment.start_time).toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <audio controls src={`${segment.file_path}`} className="mr-4" />
        <div className="flex space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;