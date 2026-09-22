import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Pause, Loader2, Download, X } from 'lucide-react';
import { setIsPlaying, setCurrentPlaying } from '../../store/slices/audioSegmentsSlice';
import dayjs from "dayjs";
import { formatSegmentDateTimeInChannelTz } from '../../utils/dateTimeUtils';

// Auto-recovery re-points the audio element at a freshly fetched source, which can
// itself fail and re-fire `error`. Capping the attempts keeps a broken source (404,
// undecodable body) from looping fetches forever.
const MAX_RECOVERY_ATTEMPTS = 2;

class HttpError extends Error {
  constructor(status) {
    super(`HTTP error! status: ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

const AudioPlayer = ({ segment, onClose }) => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeekable, setIsSeekable] = useState(true);
  const [seekWarningDismissed, setSeekWarningDismissed] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  // A ref, not state: nothing renders from it, and cleanup must see the current
  // URLs to revoke them (a state closure would go stale and leak).
  const preloadedUrlsRef = useRef({});
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isPlaying, currentPlayingId } = useSelector((state) => state.audioSegments);
  const ignoreMediaEventsRef = useRef(false);
  const recoveryAttemptsRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const withIgnoredMediaEvents = (fn) => {
    ignoreMediaEventsRef.current = true;
    try {
      fn();
    } finally {
      window.setTimeout(() => {
        ignoreMediaEventsRef.current = false;
      }, 0);
    }
  };

  // Release every blob this player created. The parent keys <AudioPlayer> by segment
  // id, so a segment change unmounts and runs this too.
  useEffect(() => {
    return () => {
      Object.values(preloadedUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      preloadedUrlsRef.current = {};
    };
  }, []);

  if (!segment) return null;
  
  // Use audio_url if available (for podcast segments), otherwise use file_path
  const fullSrc = segment.audio_url 
    ? segment.audio_url 
    : `${import.meta.env.VITE_API_URL}/${segment.file_path}`;



  // Replacing a cached blob for the same segment orphans the old one, so release it.
  const rememberPreloadedUrl = (blobUrl) => {
    const replaced = preloadedUrlsRef.current[segment.id];
    if (replaced && replaced !== blobUrl) {
      URL.revokeObjectURL(replaced);
    }
    preloadedUrlsRef.current[segment.id] = blobUrl;
  };

  // Preload the entire audio file to enable seeking
  const enableSeekingWorkaround = async () => {
    try {
      ignoreMediaEventsRef.current = true;
      setIsPreloading(true);
      setHasError(false);
      
      // Check if we've already preloaded this audio
      if (preloadedUrlsRef.current[segment.id]) {
        audioRef.current.src = preloadedUrlsRef.current[segment.id];
        setIsSeekable(true);
        setIsPreloading(false);
        
        // If audio was playing, resume playback
        if (isPlaying && currentPlayingId === segment.id) {
          audioRef.current.play().catch(err => {
            console.error("Play failed after preload:", err);
            setHasError(true);
            setErrorMessage("Failed to play audio after preloading");
          });
        }
        return;
      }
      
      // For external URLs (audio_url), we need to handle CORS
      const isExternalUrl = segment.audio_url && fullSrc === segment.audio_url;
      
      // For external URLs, try to fetch with CORS mode
      // Note: Many external audio servers don't allow CORS, so this might fail
      if (isExternalUrl) {
        const fetchOptions = {
          method: 'GET',
          mode: 'cors', // Explicitly request CORS
          credentials: 'omit', // Don't send credentials for external URLs
        };
        
        let response;
        try {
          response = await fetch(fullSrc, fetchOptions);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (fetchError) {
          // If CORS fails for external URLs, we can't preload
          // However, the audio element might still support native seeking
          // if the server supports Range requests (many podcast CDNs do)
          console.warn("CORS error when fetching external audio for preload. Native seeking may still work if server supports Range requests.", fetchError);
          setIsPreloading(false);
          // Don't disable seeking - let the audio element try native seeking
          // Many podcast CDNs support Range requests even if CORS blocks preloading
          // The handleLoadedMetadata will check if native seeking works
          return;
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Store the preloaded URL for future use, releasing any it replaces
        rememberPreloadedUrl(blobUrl);
        
        // Store the current time before changing the source
        const currentTime = audioRef.current.currentTime;
        
        // Update the audio source
        audioRef.current.src = blobUrl;
        setIsSeekable(true);
        setIsPreloading(false);
        
        // Reload the audio element and set the current time
        audioRef.current.load();
        audioRef.current.currentTime = currentTime;
        
        // Add event listener to ensure metadata is loaded
        const handleLoad = () => {
          setDuration(audioRef.current.duration);
          audioRef.current.removeEventListener('loadedmetadata', handleLoad);
          
          // If audio was playing, resume playback
          if (isPlaying && currentPlayingId === segment.id) {
            audioRef.current.play().catch(err => {
              console.error("Play failed after preload:", err);
              setHasError(true);
              setErrorMessage("Failed to play audio after preloading");
            });
          }
        };
        
        audioRef.current.addEventListener('loadedmetadata', handleLoad);
        return;
      }
      
      // For local files, use standard fetch
      const response = await fetch(fullSrc);

      // fetch() only rejects on network failure, so a 404/500 arrives here as a
      // normal response. Without this check its error body becomes the "audio" blob.
      if (!response.ok) {
        throw new HttpError(response.status);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Store the preloaded URL for future use, releasing any it replaces
      rememberPreloadedUrl(blobUrl);
      
      // Store the current time before changing the source
      const currentTime = audioRef.current.currentTime;
      
      // Update the audio source
      audioRef.current.src = blobUrl;
      setIsSeekable(true);
      setIsPreloading(false);
      
      // Reload the audio element and set the current time
      audioRef.current.load();
      audioRef.current.currentTime = currentTime;
      
      // Add event listener to ensure metadata is loaded
      const handleLoad = () => {
        setDuration(audioRef.current.duration);
        audioRef.current.removeEventListener('loadedmetadata', handleLoad);
        
        // If audio was playing, resume playback
        if (isPlaying && currentPlayingId === segment.id) {
          audioRef.current.play().catch(err => {
            console.error("Play failed after preload:", err);
            setHasError(true);
            setErrorMessage("Failed to play audio after preloading");
          });
        }
      };
      
      audioRef.current.addEventListener('loadedmetadata', handleLoad);
    } catch (error) {
      console.error("Failed to preload audio:", error);
      setIsPreloading(false);
      
      // For external URLs with CORS issues, don't show error - just disable seeking
      if (segment.audio_url && fullSrc === segment.audio_url) {
        console.warn("Cannot preload external audio due to CORS. Seeking disabled.");
        setIsSeekable(false);
      } else {
        setHasError(true);
        setErrorMessage(
          error instanceof HttpError
            ? error.status === 404
              ? "This audio file is no longer available on the server."
              : `Couldn't load audio (server returned ${error.status}).`
            : "Failed to load audio. The file may be corrupted or unavailable."
        );
      }
    } finally {
      window.setTimeout(() => {
        ignoreMediaEventsRef.current = false;
      }, 0);
    }
  };

  // Try to play audio with error handling
  const tryPlayAudio = async (audioElement) => {
    if (!audioElement) return;
    try {
      await audioElement.play();
      setHasError(false);
    } catch (err) {
      // Filter refresh / src reload aborts in-flight play(); that is not a real error.
      if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
        return;
      }
      console.error("Play failed:", err);
      setHasError(true);
      setErrorMessage("Failed to play audio. The file format may not be supported.");
      
      // If play failed due to seeking issues, try preloading
      if (!isSeekable) {
        enableSeekingWorkaround();
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Fresh source, fresh recovery budget.
    recoveryAttemptsRef.current = 0;

    // Set up event listeners
    const handleLoadedMetadata = () => {
      console.log("Loaded metadata, duration:", audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
      
      // Check if the audio is seekable
      if (audio.seekable && audio.seekable.length > 0) {
        const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
        const seekable = seekableEnd > 0 && !isNaN(seekableEnd);
        setIsSeekable(seekable);
        
        // For external URLs, give it a moment to check if seeking actually works
        // Many podcast CDNs support range requests even if initial check fails
        if (!seekable) {
          console.warn("Audio appears not seekable. Checking if preload is needed...");
          // For external URLs, wait a bit longer before preloading
          // Sometimes the browser needs time to determine seekability
          const isExternalUrl = segment.audio_url && fullSrc === segment.audio_url;
          if (isExternalUrl) {
            // Give external URLs more time - they might support range requests
            // Also test if seeking actually works by trying to set currentTime
            setTimeout(() => {
              if (audio.seekable && audio.seekable.length > 0) {
                const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
                const isNowSeekable = seekableEnd > 0 && !isNaN(seekableEnd);
                if (isNowSeekable) {
                  setIsSeekable(true);
                } else {
                  // Test if seeking actually works by trying to seek
                  const testTime = Math.min(5, audio.duration / 2);
                  const originalTime = audio.currentTime;
                  try {
                    audio.currentTime = testTime;
                    // Wait a moment to see if the seek actually happened
                    setTimeout(() => {
                      const timeAfterSeek = audio.currentTime;
                      // If the time changed significantly, seeking works
                      if (Math.abs(timeAfterSeek - testTime) < 1) {
                        console.log("Native seeking works for external URL!");
                        setIsSeekable(true);
                      } else {
                        // Seek didn't work, try preloading
                        console.warn("Native seeking doesn't work. Attempting preload...");
                        audio.currentTime = originalTime; // Reset
                        enableSeekingWorkaround();
                      }
                    }, 500);
                  } catch (seekError) {
                    console.warn("Seek test failed:", seekError);
                    enableSeekingWorkaround();
                  }
                }
              } else {
                enableSeekingWorkaround();
              }
            }, 1500);
          } else {
            // For local files, preload immediately
            enableSeekingWorkaround();
          }
        }
      } else {
        // No seekable ranges yet - might need to wait or preload
        const isExternalUrl = segment.audio_url && fullSrc === segment.audio_url;
        if (isExternalUrl) {
          // For external URLs, wait a bit to see if ranges become available
          setTimeout(() => {
            if (audio.seekable && audio.seekable.length > 0) {
              const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
              const isNowSeekable = seekableEnd > 0 && !isNaN(seekableEnd);
              if (isNowSeekable) {
                setIsSeekable(true);
              } else {
                // Test if seeking actually works
                const testTime = Math.min(5, audio.duration / 2);
                try {
                  audio.currentTime = testTime;
                  setTimeout(() => {
                    const timeAfterSeek = audio.currentTime;
                    if (Math.abs(timeAfterSeek - testTime) < 1) {
                      console.log("Native seeking works for external URL!");
                      setIsSeekable(true);
                    } else {
                      setIsSeekable(false);
                      enableSeekingWorkaround();
                    }
                  }, 500);
                } catch (seekError) {
                  setIsSeekable(false);
                  enableSeekingWorkaround();
                }
              }
            } else {
              // Test if seeking actually works even without seekable ranges
              const testTime = Math.min(5, audio.duration / 2);
              try {
                audio.currentTime = testTime;
                setTimeout(() => {
                  const timeAfterSeek = audio.currentTime;
                  if (Math.abs(timeAfterSeek - testTime) < 1) {
                    console.log("Native seeking works for external URL!");
                    setIsSeekable(true);
                  } else {
                    setIsSeekable(false);
                    enableSeekingWorkaround();
                  }
                }, 500);
              } catch (seekError) {
                setIsSeekable(false);
                enableSeekingWorkaround();
              }
            }
          }, 1500);
        } else {
          setIsSeekable(false);
          console.warn("Audio is not seekable. Auto-preloading...");
          enableSeekingWorkaround();
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      if (ignoreMediaEventsRef.current) return;
      // In-flight play() after the user paused must not flip Redux back to playing.
      if (!isPlayingRef.current) {
        audio.pause();
        return;
      }
      dispatch(setIsPlaying(true));
      setHasError(false);
    };

    const handlePause = () => {
      if (ignoreMediaEventsRef.current) return;
      dispatch(setIsPlaying(false));
    };

    const handleEnded = () => {
      dispatch(setIsPlaying(false));
      setCurrentTime(0);
    };

    const handleError = (e) => {
      setIsLoading(false);
      console.error("Error loading audio:", e);
      setIsSeekable(false);
      setHasError(true);
      setErrorMessage("Failed to load audio. The file may be corrupted or unavailable.");

      if (recoveryAttemptsRef.current >= MAX_RECOVERY_ATTEMPTS) {
        console.warn(`Giving up after ${MAX_RECOVERY_ATTEMPTS} recovery attempts.`);
        return;
      }
      recoveryAttemptsRef.current += 1;

      // Try to preload as a fallback
      enableSeekingWorkaround();
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      setHasError(false);
      recoveryAttemptsRef.current = 0;
    };

    const handleStalled = () => {
      console.log("Audio stalled, trying to recover...");
    };

    // Check if server supports range requests
    const checkRangeSupport = async () => {
      const isExternalUrl = segment.audio_url && fullSrc === segment.audio_url;
      
      // For external URLs, don't check range support via HEAD request
      // (CORS might block it, but GET requests with Range headers might still work)
      // Instead, rely on the audio element's native seeking capabilities
      if (isExternalUrl) {
        console.log("External URL detected. Relying on native audio element seeking capabilities.");
        // Don't disable seeking - let the audio element try to seek natively
        // Many podcast CDNs support Range requests even if HEAD requests fail
        return;
      }
      
      // For local files, check range support
      try {
        const fetchOptions = {
          method: 'HEAD',
          headers: {
            'Range': 'bytes=0-1'
          }
        };
        
        const response = await fetch(fullSrc, fetchOptions);
        
        const acceptsRanges = response.headers.get('accept-ranges') === 'bytes';
        const contentRange = response.headers.get('content-range');
        
        if (!acceptsRanges && !contentRange) {
          console.warn("Server does not support range requests");
          setIsSeekable(false);
        }
      } catch (err) {
        console.warn("Could not check range support:", err);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('stalled', handleStalled);

    // Check range support when component mounts
    checkRangeSupport();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [segment.id, dispatch, fullSrc]);

  // Effect to handle play/pause from Redux
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (String(currentPlayingId) !== String(segment.id)) return;

    if (isPlaying && audio.paused) {
      tryPlayAudio(audio);
    } else if (!isPlaying && !audio.paused) {
      withIgnoredMediaEvents(() => audio.pause());
    }
  }, [isPlaying, currentPlayingId, segment.id]);

  const handleExternalPlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying && String(currentPlayingId) === String(segment.id)) {
      isPlayingRef.current = false;
      dispatch(setIsPlaying(false));
      withIgnoredMediaEvents(() => audioRef.current.pause());
    } else {
      if (String(currentPlayingId) !== String(segment.id)) {
        dispatch(setCurrentPlaying(segment.id));
      }
      isPlayingRef.current = true;
      dispatch(setIsPlaying(true));
    }
  };

  const handleSeek = (e) => {
    if (!isSeekable) return;
    
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle download to open in new tab
  const handleDownload = () => {
    window.open(fullSrc, '_blank');
  };

  // Retry loading the audio
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    recoveryAttemptsRef.current = 0;
    
    // Reset the audio element
    if (audioRef.current) {
      audioRef.current.src = fullSrc;
      audioRef.current.load();
      
      // Try to play if it's the current playing segment
      if (currentPlayingId === segment.id && isPlaying) {
        setTimeout(() => tryPlayAudio(audioRef.current), 100);
      }
    }
  };

  // Calculate the max value for the progress bar
  const progressMax = duration > 0 ? duration : (segment.duration_seconds || 0);
  const progressPercent = progressMax > 0 ? (currentTime / progressMax) * 100 : 0;

  return (
    <div>
      {/* Compact single-row player: play control, title + inline progress, download, close */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleExternalPlayPause}
          className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          aria-label={isPlaying && currentPlayingId === segment.id ? 'Pause' : 'Play'}
          disabled={isPreloading || hasError}
        >
          {isPreloading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (isPlaying && currentPlayingId === segment.id) ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium text-gray-900 truncate"
            title={`Start: ${formatSegmentDateTimeInChannelTz(segment.start_time)} • End: ${formatSegmentDateTimeInChannelTz(segment.end_time)}`}
          >
            {segment.title ? (
              segment.title
            ) : (
              `${segment.title_before ? "Audio Before: " + segment.title_before : ""}${
                segment.title_before && segment.title_after ? " - " : ""
              }${segment.title_after ? "Audio After: " + segment.title_after : ""}`.trim() ||
              "Untitled Report Item"
            )}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 tabular-nums w-9 shrink-0">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={progressMax}
              value={currentTime}
              onChange={handleSeek}
              disabled={!isSeekable || isPreloading || hasError}
              aria-label="Seek audio position"
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(progressMax)}`}
              className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:rounded-full
                ${isSeekable && !isPreloading && !hasError
                  ? '[&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer'
                  : '[&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:cursor-not-allowed'}`}
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${progressPercent}%, #e5e7eb ${progressPercent}%, #e5e7eb 100%)`
              }}
            />
            <span className="text-xs text-gray-500 tabular-nums w-9 shrink-0 text-right">{formatTime(progressMax)}</span>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="shrink-0 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
          title="Download audio"
          aria-label="Download audio"
          disabled={isLoading || isPreloading || hasError}
        >
          <Download className="w-5 h-5" />
        </button>

        <button
          onClick={onClose}
          className="shrink-0 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
          aria-label="Close audio player"
          disabled={isPreloading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Status banners — only take up space when there's something to say */}
      {isPreloading && (
        <div className="mt-2 px-3 py-1.5 rounded-md bg-blue-50 text-xs text-blue-600 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Preparing audio for seeking...
        </div>
      )}

      {!isSeekable && !isPreloading && !isLoading && !hasError && (
        <div className="mt-2 px-3 py-1.5 rounded-md bg-amber-50 text-xs text-amber-700">
          Seeking isn't available for this audio — you can still play it from the start.
        </div>
      )}

      {hasError && (
        <div className="mt-2 px-3 py-2 rounded-md bg-red-50 flex items-center justify-between gap-3">
          <span className="text-xs text-red-600">{errorMessage}</span>
          <button
            onClick={handleRetry}
            className="shrink-0 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Browser audio element (hidden but functional) */}
      <audio
        ref={audioRef}
        preload="metadata"
        src={fullSrc}
        className="hidden"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioPlayer;