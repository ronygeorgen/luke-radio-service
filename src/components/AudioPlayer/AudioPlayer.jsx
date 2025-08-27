import React, { useRef, useState, useEffect } from 'react';
import { 
  initializeAudioWithSeeking, 
  seekAudio, 
  formatTime, 
  isAudioSeekable,
  audioPlayerManager 
} from '../../utils/audioUtils';

const AudioPlayer = ({ src }) => {
  const fullSrc = `${import.meta.env.VITE_API_AUDIO_URL}${src}`;
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSeekable, setIsSeekable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Reset error state when src changes
    setHasError(false);
    setIsLoading(true);
    
    const audio = audioRef.current;
    if (!audio) return;

    const handleError = () => {
      console.error('Error loading audio:', src);
      setHasError(true);
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      
      // Check if audio is seekable
      const seekable = isAudioSeekable(audio);
      setIsSeekable(seekable);
      
      // Initialize seeking support if needed
      if (!seekable) {
        initializeAudioWithSeeking(fullSrc, audio, setIsSeekable);
      }
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Add to global audio manager
    audioPlayerManager.addPlayer(audio, setIsPlaying);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      // Remove from global audio manager
      audioPlayerManager.removePlayer(audio);
    };
  }, [src, fullSrc]);

  const togglePlay = () => {
    if (!src || hasError) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Pause all other audio players
    audioPlayerManager.pauseAllExcept(audio);

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Playback failed:', error);
        setHasError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (isDragging) return;
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleProgressBarClick = (e) => {
    if (!isSeekable) return;
    
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;
    handleSeek(percentage);
  };

  const handleMouseDown = () => {
    if (!isSeekable) return;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isSeekable) return;
    
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    let clickPosition = e.clientX - rect.left;
    clickPosition = Math.max(0, Math.min(clickPosition, rect.width));
    const percentage = (clickPosition / rect.width) * 100;
    setProgress(percentage);
  };

  const handleMouseUp = (e) => {
    if (!isSeekable) return;
    
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;
    handleSeek(percentage);
  };

  const handleSeek = async (percentage) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || !isSeekable) return;

    const newTime = (percentage / 100) * audio.duration;
    const success = await seekAudio(audio, newTime);
    
    if (success) {
      setProgress(percentage);
    }
  };

  if (!src || hasError) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-500">
            {hasError ? 'Loading audio...' : 'Preparing audio...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={togglePlay}
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400"
        disabled={!src || isLoading}
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="flex-1 flex items-center space-x-2">
        <span className="text-xs text-gray-500 w-8">{formatTime(audioRef.current?.currentTime || 0)}</span>
        
        <div 
          ref={progressBarRef}
          className={`flex-1 bg-gray-200 rounded-full h-2 relative ${
            isSeekable ? 'cursor-pointer' : 'cursor-not-allowed'
          }`}
          onClick={handleProgressBarClick}
        >
          <div
            className="bg-blue-500 h-2 rounded-full relative transition-all duration-150"
            style={{ width: `${progress}%` }}
          >
            {isSeekable && (
              <div 
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-blue-700 rounded-full cursor-pointer hover:bg-blue-800 transition-colors"
                onMouseDown={handleMouseDown}
              />
            )}
          </div>
        </div>
        
        <span className="text-xs text-gray-500 w-8">{formatTime(duration)}</span>
      </div>
      
      <audio
        ref={audioRef}
        src={fullSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => {
          // Only update state if this was an actual pause (not because another player took over)
          if (isPlaying) {
            setIsPlaying(false);
          }
        }}
        preload="metadata"
      />
    </div>
  );
};

export default AudioPlayer;