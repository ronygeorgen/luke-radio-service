import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIsPlaying, setCurrentPlaying } from '../../store/slices/audioSegmentsSlice';

const AudioPlayer = ({ segment, onClose }) => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeekable, setIsSeekable] = useState(true);
  const [seekWarningDismissed, setSeekWarningDismissed] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const { isPlaying, currentPlayingId } = useSelector((state) => state.audioSegments);
  
  if (!segment) return null;
  
  const fullSrc = `${import.meta.env.VITE_API_URL}/${segment.file_path}`;

  // Format the time display for the header
  const formatHeaderTime = (startTime) => {
    try {
      const date = new Date(startTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid time';
    }
  };

  // Preload the entire audio file to enable seeking
  const enableSeekingWorkaround = async () => {
    try {
      setIsPreloading(true);
      
      // Pause audio if it's currently playing
      if (isPlaying && currentPlayingId === segment.id) {
        dispatch(setIsPlaying(false));
      }
      
      const response = await fetch(fullSrc);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
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
      };
      
      audioRef.current.addEventListener('loadedmetadata', handleLoad);
    } catch (error) {
      console.error("Failed to preload audio:", error);
      setIsPreloading(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set up event listeners
    const handleLoadedMetadata = () => {
      console.log("Loaded metadata, duration:", audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      
      // Check if the audio is seekable
      if (audio.seekable && audio.seekable.length > 0) {
        const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
        const seekable = seekableEnd > 0 && !isNaN(seekableEnd);
        setIsSeekable(seekable);
        
        if (!seekable) {
          console.warn("Audio is not seekable. This could be due to:");
          console.warn("1. Server not supporting range requests");
          console.warn("2. Audio encoding issues");
          console.warn("3. CORS restrictions on range requests");
        }
      } else {
        setIsSeekable(false);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      dispatch(setIsPlaying(true));
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
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    const handleStalled = () => {
      console.log("Audio stalled, trying to recover...");
    };

    // Check if server supports range requests
    const checkRangeSupport = async () => {
      try {
        const response = await fetch(fullSrc, {
          method: 'HEAD',
          headers: {
            'Range': 'bytes=0-1'
          }
        });
        
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

    // Auto-play when component mounts if this is the current playing segment
    if (currentPlayingId === segment.id) {
      const playAudio = async () => {
        try {
          await audio.play();
        } catch (err) {
          console.error("Auto-play failed:", err);
        }
      };
      playAudio();
    }

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
  }, [segment.id, currentPlayingId, dispatch, fullSrc]);

  // Effect to handle play/pause from Redux
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only control audio if this is the current playing segment
    if (currentPlayingId === segment.id) {
      if (isPlaying && audio.paused) {
        audio.play().catch(err => console.error("Play failed:", err));
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, currentPlayingId, segment.id]);

  const handleExternalPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying && currentPlayingId === segment.id) {
        dispatch(setIsPlaying(false));
      } else {
        // If a different segment is playing, change the current playing first
        if (currentPlayingId !== segment.id) {
          dispatch(setCurrentPlaying(segment.id));
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

  // Calculate the max value for the progress bar
  const progressMax = duration > 0 ? duration : (segment.duration_seconds || 0);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Header with close button and external play/pause control */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleExternalPlayPause}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
            aria-label={isPlaying && currentPlayingId === segment.id ? 'Pause' : 'Play'}
          >
            {(isPlaying && currentPlayingId === segment.id) ? (
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
              {segment.title || 'Untitled Audio'}
            </h3>
            <p className="text-sm text-blue-100">
              {formatTime(segment.duration_seconds)} • {formatHeaderTime(segment.start_time)}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-blue-400 transition-colors duration-200"
          aria-label="Close audio player"
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
            disabled={!isSeekable}
            className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:h-4 
              [&::-webkit-slider-thumb]:w-4 
              [&::-webkit-slider-thumb]:rounded-full 
              ${isSeekable 
                ? 'bg-gray-200 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer' 
                : 'bg-gray-100 [&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:cursor-not-allowed'}`}
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime/progressMax)*100}%, #e5e7eb ${(currentTime/progressMax)*100}%, #e5e7eb 100%)`
            }}
          />
          <span className="text-xs text-gray-500 w-10">{formatTime(progressMax)}</span>
        </div>
        
        {!isSeekable && !seekWarningDismissed && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md flex justify-between items-center">
            <div>
              <strong>Seeking is not available for this audio file</strong>
              <p className="mt-1">This is usually a server configuration issue.</p>
            </div>
            <button 
              onClick={() => setSeekWarningDismissed(true)}
              className="ml-2 text-amber-800 hover:text-amber-900"
              aria-label="Dismiss warning"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {!isSeekable && (
          <div className="preload-section">
            <button 
              onClick={enableSeekingWorkaround}
              disabled={isPreloading}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {isPreloading ? 'Loading...' : 'Preload Audio for Seeking'}
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
        
        {/* Custom controls and download button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleExternalPlayPause}
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              aria-label={isPlaying && currentPlayingId === segment.id ? 'Pause' : 'Play'}
            >
              {(isPlaying && currentPlayingId === segment.id) ? (
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
              {isLoading ? 'Loading...' : 
                (isPlaying && currentPlayingId === segment.id) ? 'Playing' : 'Paused'} • {formatTime(currentTime)} / {formatTime(progressMax)}
            </span>
          </div>
          
          <button 
            onClick={handleDownload}
            className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            disabled={isLoading}
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

export default AudioPlayer;