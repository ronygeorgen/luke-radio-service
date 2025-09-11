// utils/pollingCleanup.js
import { loadState, saveState } from './storageUtils';

export const cleanupOldPollingData = () => {
  const polling = loadState('transcriptionPolling') || {};
  const nextPollTime = loadState('nextPollTime') || {};
  const now = Date.now();
  
  let needsCleanup = false;
  const updatedPolling = { ...polling };
  const updatedNextPollTime = { ...nextPollTime };
  
  // Remove polling entries that are older than 1 hour
  Object.entries(nextPollTime).forEach(([segmentId, pollTime]) => {
    if (now - pollTime > 3600000) { // 1 hour
      delete updatedPolling[segmentId];
      delete updatedNextPollTime[segmentId];
      needsCleanup = true;
    }
  });
  
  if (needsCleanup) {
    saveState('transcriptionPolling', updatedPolling);
    saveState('nextPollTime', updatedNextPollTime);
  }
  
  return { transcriptionPolling: updatedPolling, nextPollTime: updatedNextPollTime };
};