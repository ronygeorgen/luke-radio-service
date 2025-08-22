// AudioPlayer.js
import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIsPlaying } from '../../store/slices/audioSegmentsSlice';

const AudioPlayer = ({ segment, onClose }) => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const { isPlaying } = useSelector((state) => state.audioSegments);
  
  if (!segment) return null;
  
  const fullSrc = `${import.meta.env.VITE_API_URL}/${segment.file_path}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      dispatch(setIsPlaying(true));
    };

    const handlePause = () => {
      dispatch(setIsPlaying(false));
    };

    const handleEnded = () => {
      dispatch(setIsPlaying(false));
      dispatch(setCurrentPlaying(null));
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Sync the audio element with Redux state
    if (isPlaying && audio.paused) {
      audio.play().catch(console.error);
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, dispatch]);

  const handleExternalPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Header with close button and external play/pause control */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleExternalPlayPause}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>
          <div>
            <h3 className="font-semibold text-white text-lg truncate max-w-xs">
              {segment.title || 'Untitled Audio'}
            </h3>
            <p className="text-sm text-blue-100">
              {segment.duration_seconds}s • {new Date(segment.start_time).toLocaleTimeString()}
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

      {/* Audio controls */}
      <div className="p-4">
        <audio 
          ref={audioRef}
          controls
          autoPlay
          src={fullSrc}
          className="w-full h-12 [&::-webkit-media-controls-panel]:bg-gray-50 [&::-webkit-media-controls-panel]:rounded-lg"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};

export default AudioPlayer;