import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startTranscriptionPolling } from '../store/slices/audioSegmentsSlice';
import { cleanupOldPollingData } from '../utils/pollingCleanup';

const TranscriptionPollingHydrator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;

    const { transcriptionPolling, nextPollTime } = cleanupOldPollingData();

    Object.entries(transcriptionPolling).forEach(([segmentId, isPolling]) => {
      if (isPolling && nextPollTime[segmentId]) {
        const now = Date.now();
        const timeRemaining = nextPollTime[segmentId] - now;

        if (timeRemaining > 0) {
          const secondsRemaining = Math.ceil(timeRemaining / 1000);
          dispatch(startTranscriptionPolling({ 
            segmentId: parseInt(segmentId), 
            nextPollSeconds: secondsRemaining 
          }));
        } else {
          dispatch(startTranscriptionPolling({ 
            segmentId: parseInt(segmentId), 
            nextPollSeconds: 5
          }));
        }
      }
    });
  }, [dispatch, isAuthenticated, isLoading]);

  return null;
};

export default TranscriptionPollingHydrator;


