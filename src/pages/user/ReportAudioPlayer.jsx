// components/UserSide/ReportAudioPlayer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIsPlaying, setCurrentPlaying } from '../../store/slices/audioSegmentsSlice';

const ReportAudioPlayer = ({ segment, onClose }) => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeekable, setIsSeekable] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedUrls, setPreloadedUrls] = useState({});
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isPlaying, currentPlayingId } = useSelector((state) => state.audioSegments);
  
  // Get the correct segment ID for this specific data structure
  const segmentId = segment?.audio_segment_id || null;
  
  // Get the file path or audio URL - handle the specific API response structure
  // Use audio_url if available (for podcast segments), otherwise use file_path
  const getAudioSource = () => {
    if (!segment) return null;
    if (segment.audio_url) return segment.audio_url;
    if (segment.file_path) return `${import.meta.env.VITE_API_URL}/${segment.file_path}`;
    return null;
  };
  
  const fullSrc = getAudioSource();

  // Format time for display
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format header time
const formatHeaderTime = (backendTime) => {
  try {
    if (!backendTime) return 'Invalid time';
    // Show raw backend time without conversion
    return backendTime; // Shows full timestamp like "2025-10-21T18:30:00.000Z"
  } catch (e) {
    return 'Invalid time';
  }
};

  // Preload the entire audio file to enable seeking
  const enableSeekingWorkaround = async () => {
    try {
      setIsPreloading(true);
      setHasError(false);
      
      // Check if we've already preloaded this audio
      if (preloadedUrls[segmentId]) {
        audioRef.current.src = preloadedUrls[segmentId];
        setIsSeekable(true);
        setIsPreloading(false);
        
        // If audio was playing, resume playback
        if (isPlaying && currentPlayingId === segmentId) {
          audioRef.current.play().catch(err => {
            console.error("Play failed after preload:", err);
            setHasError(true);
            setErrorMessage("Failed to play audio after preloading");
          });
        }
        return;
      }
      
      const response = await fetch(fullSrc);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Store the preloaded URL for future use
      setPreloadedUrls(prev => ({ ...prev, [segmentId]: blobUrl }));
      
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
        if (isPlaying && currentPlayingId === segmentId) {
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
      setHasError(true);
      setErrorMessage("Failed to load audio. The file may be corrupted or unavailable.");
    }
  };

  // Try to play audio with error handling
  const tryPlayAudio = async (audioElement) => {
    try {
      await audioElement.play();
      setHasError(false);
    } catch (err) {
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
    if (!audio || !fullSrc) return;

    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
      
      // Check if the audio is seekable
      if (audio.seekable && audio.seekable.length > 0) {
        const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
        const seekable = seekableEnd > 0 && !isNaN(seekableEnd);
        setIsSeekable(seekable);
        
        if (!seekable) {
          enableSeekingWorkaround();
        }
      } else {
        setIsSeekable(false);
        enableSeekingWorkaround();
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      dispatch(setIsPlaying(true));
      setHasError(false);
    };

    const handlePause = () => {
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
      
      // Try to preload as a fallback
      enableSeekingWorkaround();
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      setHasError(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    // Auto-play when component mounts if this is the current playing segment
    if (currentPlayingId === segmentId) {
      tryPlayAudio(audio);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [segmentId, currentPlayingId, dispatch, fullSrc]);

  // Effect to handle play/pause from Redux
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only control audio if this is the current playing segment
    if (currentPlayingId === segmentId) {
      if (isPlaying && audio.paused) {
        tryPlayAudio(audio);
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, currentPlayingId, segmentId]);

  const handleExternalPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying && currentPlayingId === segmentId) {
        dispatch(setIsPlaying(false));
      } else {
        // If a different segment is playing, change the current playing first
        if (currentPlayingId !== segmentId) {
          dispatch(setCurrentPlaying(segmentId));
        }
        dispatch(setIsPlaying(true));
      }
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

  // Handle download to open in new tab
  const handleDownload = () => {
    window.open(fullSrc, '_blank');
  };

  // Retry loading the audio
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    
    // Reset the audio element
    if (audioRef.current) {
      audioRef.current.src = fullSrc;
      audioRef.current.load();
      
      // Try to play if it's the current playing segment
      if (currentPlayingId === segmentId && isPlaying) {
        setTimeout(() => tryPlayAudio(audioRef.current), 100);
      }
    }
  };

  // Get duration from segment or audio element
  const getDuration = () => {
    if (duration > 0) return duration;
    return segment.duration_seconds || 0;
  };

  // Calculate the max value for the progress bar
  const progressMax = getDuration();

  if (!segment || !filePath) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Header with close button and external play/pause control */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleExternalPlayPause}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
            aria-label={isPlaying && currentPlayingId === segmentId ? 'Pause' : 'Play'}
            disabled={isPreloading || hasError}
          >
            {isPreloading ? (
              <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (isPlaying && currentPlayingId === segmentId) ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-lg truncate">
              {segment.title || 
               `${segment.title_before ? "Audio Before: " + segment.title_before : ""}${
                 segment.title_before && segment.title_after ? " - " : ""
               }${segment.title_after ? "Audio After: " + segment.title_after : ""}`.trim() || 
               "Audio Segment"}
            </h3>
            <p className="text-sm text-blue-100">
              Duration: {formatTime(segment.duration_seconds)} • 
              Start: {formatHeaderTime(segment.start_time)} • 
              End: {formatHeaderTime(segment.end_time)}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-blue-400 transition-colors duration-200"
          aria-label="Close audio player"
          disabled={isPreloading}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Custom audio controls */}
      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={progressMax}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isSeekable || isPreloading || hasError}
            className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:w-4 
              [&::-webkit-slider-thumb]:rounded-full 
              ${isSeekable && !isPreloading && !hasError
                ? 'bg-gray-200 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer' 
                : 'bg-gray-100 [&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:cursor-not-allowed'}`}
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime/progressMax)*100}%, #e5e7eb ${(currentTime/progressMax)*100}%, #e5e7eb 100%)`
            }}
          />
          <span className="text-xs text-gray-500 w-10">{formatTime(progressMax)}</span>
        </div>
        
        {isPreloading && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Preloading audio for seeking functionality...</span>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <strong>Error playing audio</strong>
                <p className="mt-1">{errorMessage}</p>
              </div>
              <button 
                onClick={handleRetry}
                className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors duration-200"
              >
                Retry
              </button>
            </div>
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
        
        {/* Custom controls and download button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleExternalPlayPause}
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              aria-label={isPlaying && currentPlayingId === segmentId ? 'Pause' : 'Play'}
              disabled={isPreloading || hasError}
            >
              {isPreloading ? (
                <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (isPlaying && currentPlayingId === segmentId) ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              )}
            </button>
            
            <span className="text-sm text-gray-600">
              {hasError ? 'Error' : 
                isPreloading ? 'Preloading...' : 
                isLoading ? 'Loading...' : 
                (isPlaying && currentPlayingId === segmentId) ? 'Playing' : 'Paused'} • {formatTime(currentTime)} / {formatTime(progressMax)}
            </span>
          </div>
          
          <button 
            onClick={handleDownload}
            className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            disabled={isLoading || isPreloading || hasError}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportAudioPlayer;