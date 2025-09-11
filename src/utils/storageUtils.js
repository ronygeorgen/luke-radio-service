// utils/storageUtils.js
export const loadState = (key) => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return undefined;
  }
};

export const saveState = (key, state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
};

export const removeState = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Error removing state from localStorage:', err);
  }
};

// Specific functions for transcription polling
export const loadPollingState = () => {
  return {
    transcriptionPolling: loadState('transcriptionPolling') || {},
    nextPollTime: loadState('nextPollTime') || {}
  };
};

export const savePollingState = (pollingState) => {
  saveState('transcriptionPolling', pollingState.transcriptionPolling);
  saveState('nextPollTime', pollingState.nextPollTime);
};