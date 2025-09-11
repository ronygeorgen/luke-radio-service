// hooks/useTranscriptionPolling.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { transcribeAudioSegment, updatePollingCountdown, stopTranscriptionPolling } from '../store/slices/audioSegmentsSlice';

const useTranscriptionPolling = () => {
  const dispatch = useDispatch();
  const { transcriptionPolling, nextPollTime } = useSelector((state) => state.audioSegments);

  useEffect(() => {
    const pollSegments = () => {
      const now = Date.now();
      Object.entries(transcriptionPolling).forEach(([segmentId, isPolling]) => {
        if (isPolling && nextPollTime[segmentId]) {
          // Check if polling time has expired
          if (now >= nextPollTime[segmentId]) {
            dispatch(transcribeAudioSegment(parseInt(segmentId)));
          }
        } else if (isPolling && !nextPollTime[segmentId]) {
          // Clean up invalid polling state
          dispatch(stopTranscriptionPolling(parseInt(segmentId)));
        }
      });
    };

    const interval = setInterval(pollSegments, 1000);
    return () => clearInterval(interval);
  }, [transcriptionPolling, nextPollTime, dispatch]);

  return null;
};

export default useTranscriptionPolling;