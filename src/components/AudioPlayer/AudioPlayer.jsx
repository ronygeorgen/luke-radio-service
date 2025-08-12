import React, { useRef, useState, useEffect } from 'react';

// Track the currently playing audio globally
let currentlyPlayingAudio = null;

const AudioPlayer = ({ src }) => {

const fullSrc = `${import.meta.env.VITE_API_AUDIO_URL}${src}`;
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Reset error state when src changes
    setHasError(false);
    
    const audio = audioRef.current;
    if (!audio) return;

    const handleError = () => {
      console.error('Error loading audio:', src);
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('error', handleError);
    };
  }, [src]);

  const togglePlay = () => {
    if (!src || hasError) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Pause any currently playing audio
    if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
      currentlyPlayingAudio.pause();
      currentlyPlayingAudio.currentTime = 0;
      // Note: We rely on the other AudioPlayer's onEnded/onPause to update its state
    }

    if (isPlaying) {
      audio.pause();
      currentlyPlayingAudio = null;
    } else {
      audio.play().catch(error => {
        console.error('Playback failed:', error);
        setHasError(true);
      });
      currentlyPlayingAudio = audio;
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
    currentlyPlayingAudio = null;
  };

  const handleProgressBarClick = (e) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;
    seekAudio(percentage);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    let clickPosition = e.clientX - rect.left;
    clickPosition = Math.max(0, Math.min(clickPosition, rect.width));
    const percentage = (clickPosition / rect.width) * 100;
    setProgress(percentage);
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;
    seekAudio(percentage);
  };

  const seekAudio = (percentage) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const newTime = (percentage / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(percentage);
  };

  if (!src || hasError) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <button disabled className="p-2 bg-gray-200 rounded-full">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="text-sm">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={togglePlay}
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
        disabled={!src}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <div 
        ref={progressBarRef}
        className="flex-1 bg-gray-200 rounded-full h-2 cursor-pointer relative"
        onClick={handleProgressBarClick}
      >
        <div
          className="bg-blue-500 h-2 rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-blue-700 rounded-full cursor-pointer"
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={fullSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => {
          if (currentlyPlayingAudio === audioRef.current) {
            currentlyPlayingAudio = null;
          }
        }}
        preload="metadata"
      />
    </div>
  );
};

export default AudioPlayer;