// Audio utility functions for better seeking and audio management

/**
 * Check if the server supports range requests for better seeking
 * @param {string} audioUrl - The URL of the audio file
 * @returns {Promise<boolean>} - Whether range requests are supported
 */
export const checkRangeSupport = async (audioUrl) => {
  try {
    const response = await fetch(audioUrl, {
      method: 'HEAD',
      headers: {
        'Range': 'bytes=0-1'
      }
    });
    
    const acceptsRanges = response.headers.get('accept-ranges') === 'bytes';
    const contentRange = response.headers.get('content-range');
    
    return acceptsRanges || contentRange;
  } catch (error) {
    console.warn("Could not check range support:", error);
    return false;
  }
};

/**
 * Preload audio for seeking when range requests aren't supported
 * @param {string} audioUrl - The URL of the audio file
 * @param {HTMLAudioElement} audioElement - The audio element to update
 * @param {number} currentTime - Current playback time to restore
 * @returns {Promise<boolean>} - Whether preloading was successful
 */
export const preloadAudioForSeeking = async (audioUrl, audioElement, currentTime = 0) => {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Store current time before changing source
    const timeToRestore = audioElement?.currentTime || currentTime;
    
    // Update audio source
    audioElement.src = blobUrl;
    
    // Reload and restore position
    audioElement.load();
    
    // Wait for metadata to load before setting time
    return new Promise((resolve) => {
      const handleLoadedMetadata = () => {
        audioElement.currentTime = timeToRestore;
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        resolve(true);
      };
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    });
  } catch (error) {
    console.error("Failed to preload audio:", error);
    return false;
  }
};

/**
 * Enhanced seeking function that handles seeking without pause/resume cycle
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {number} seekTime - Time to seek to in seconds
 * @returns {Promise<boolean>} - Whether seeking was successful
 */
export const seekAudio = async (audioElement, seekTime) => {
  if (!audioElement || !audioElement.duration) return false;

  try {
    // Set the time directly without pause/resume to avoid cycling
    audioElement.currentTime = seekTime;
    return true;
  } catch (error) {
    console.error('Seek failed:', error);
    return false;
  }
};

/**
 * Initialize audio with seeking support
 * @param {string} audioUrl - The URL of the audio file
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {Function} onSeekableChange - Callback when seekable state changes
 * @returns {Promise<void>}
 */
export const initializeAudioWithSeeking = async (audioUrl, audioElement, onSeekableChange) => {
  if (!audioElement) return;

  // Check if server supports range requests
  const supportsRanges = await checkRangeSupport(audioUrl);
  
  if (!supportsRanges) {
    console.log("Server doesn't support range requests, preloading audio...");
    const success = await preloadAudioForSeeking(audioUrl, audioElement);
    onSeekableChange(success);
  } else {
    onSeekableChange(true);
  }
};

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Create a debounced function for seeking
 * @param {Function} seekFunction - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const createDebouncedSeek = (seekFunction, delay = 100) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => seekFunction(...args), delay);
  };
};

/**
 * Check if audio is seekable
 * @param {HTMLAudioElement} audioElement - The audio element
 * @returns {boolean} - Whether the audio is seekable
 */
export const isAudioSeekable = (audioElement) => {
  if (!audioElement) return false;
  
  if (audioElement.seekable && audioElement.seekable.length > 0) {
    const seekableEnd = audioElement.seekable.end(audioElement.seekable.length - 1);
    return seekableEnd > 0 && !isNaN(seekableEnd);
  }
  
  return false;
};

/**
 * Global audio player management
 */
class AudioPlayerManager {
  constructor() {
    this.players = new Set();
  }

  addPlayer(audioElement, setIsPlaying) {
    this.players.add({ audio: audioElement, setIsPlaying });
  }

  removePlayer(audioElement) {
    this.players.forEach(player => {
      if (player.audio === audioElement) {
        this.players.delete(player);
      }
    });
  }

  pauseAllExcept(audioElement) {
    this.players.forEach(player => {
      if (player.audio !== audioElement) {
        player.audio.pause();
        player.audio.currentTime = 0;
        player.setIsPlaying(false);
      }
    });
  }

  pauseAll() {
    this.players.forEach(player => {
      player.audio.pause();
      player.setIsPlaying(false);
    });
  }
}

// Export singleton instance
export const audioPlayerManager = new AudioPlayerManager();
