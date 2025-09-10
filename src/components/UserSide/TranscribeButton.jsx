// components/UserSide/TranscribeButton.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { transcribeAudioSegment, clearTranscriptionError, resetTranscriptionState }  from '../../store/slices/audioSegmentsSlice'

const TranscribeButton = ({ segmentId }) => {
  const dispatch = useDispatch();
  const { transcriptionLoading, transcriptionErrors, transcriptionStatus } = useSelector(
    (state) => state.audioSegments
  );

  const isLoading = transcriptionLoading[segmentId];
  const error = transcriptionErrors[segmentId];
  const status = transcriptionStatus[segmentId];

  const handleTranscribe = () => {
    dispatch(transcribeAudioSegment(segmentId));
  };

  const handleClearError = () => {
    dispatch(clearTranscriptionError(segmentId));
  };

  const handleReset = () => {
    dispatch(resetTranscriptionState(segmentId));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <button
          onClick={handleClearError}
          className="text-sm text-red-800 hover:text-red-900 underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (status) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-600 mb-2">{status}</p>
        <button
          onClick={handleReset}
          className="text-sm text-blue-800 hover:text-blue-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button
        onClick={handleTranscribe}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
      >
        Transcribe Audio
      </button>
    </div>
  );
};

export default TranscribeButton;