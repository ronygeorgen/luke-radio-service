import React from 'react';

// Match "Speaker N" followed by timestamp (MM:SS:FF or HH:MM:SS) then the rest of the line
const SPEAKER_LINE_REGEX = /^(Speaker \d+)\s+(\d{2}:\d{2}:\d{2})\s+(.*)$/;

const TranscriptionModal = ({ transcription, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Transcription</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {transcription.split('\n').map((line, index) => {
              const match = line.match(SPEAKER_LINE_REGEX);
              if (match) {
                const [, speaker, timestamp, text] = match;
                return (
                  <p key={index} className="whitespace-pre-line">
                    <span className="text-blue-500">{speaker} {timestamp} </span>
                    <span className="text-gray-900">{text}</span>
                  </p>
                );
              }
              return (
                <p key={index} className="whitespace-pre-line text-gray-900">
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionModal;