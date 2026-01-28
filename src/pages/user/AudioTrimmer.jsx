// components/UserSide/AudioTrimmer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { trimAudioSegment, closeTrimmer, clearError } from '../../store/slices/audioTrimmerSlice';
import { fetchAudioSegments, fetchAudioSegmentsV2 } from '../../store/slices/audioSegmentsSlice';
import { convertLocalToUTC } from '../../utils/dateTimeUtils';

const AudioTrimmer = () => {
    
  const { channelId: channelIdFromParams } = useParams();
  const channelId = channelIdFromParams || localStorage.getItem("channelId");
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const [isSegmentActive, setIsSegmentActive] = useState(true);
  const { isOpen, currentSegment, isLoading, error } = useSelector((state) => state.audioTrimmer);
  const { filters, pagination } = useSelector((state) => state.audioSegments);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [segments, setSegments] = useState([]);
  const [waveformData, setWaveformData] = useState([]);
  const [isDragging, setIsDragging] = useState(null);
  const [audioLoading, setAudioLoading] = useState(true);
  const [isSeekable, setIsSeekable] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedUrls, setPreloadedUrls] = useState({});
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize segments when component opens or segment changes
  useEffect(() => {
    if (isOpen && currentSegment) {
      const initialSegment = {
        id: 1,
        start: 0,
        end: currentSegment.duration_seconds,
        title: `Segment ${currentSegment.id}_part_1`,
        transcribe: true
      };
      setSegments([initialSegment]);
      setIsSegmentActive(true);
      setCurrentTime(0);
      setIsPlaying(false);
      setHasError(false);
      setErrorMessage('');
      generateWaveformData();
    }
  }, [isOpen, currentSegment]);

  // Generate mock waveform data
  const generateWaveformData = () => {
    const data = [];
    for (let i = 0; i < 200; i++) {
      data.push(Math.random() * 100);
    }
    setWaveformData(data);
  };

  // Preload the entire audio file to enable seeking
  const enableSeekingWorkaround = async () => {
    try {
      setIsPreloading(true);
      setHasError(false);
      
      // Check if we've already preloaded this audio
      if (preloadedUrls[currentSegment.id]) {
        audioRef.current.src = preloadedUrls[currentSegment.id];
        setIsSeekable(true);
        setIsPreloading(false);
        
        // If audio was playing, resume playback
        if (isPlaying) {
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
      setPreloadedUrls(prev => ({ ...prev, [currentSegment.id]: blobUrl }));
      
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
        if (isPlaying) {
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      console.log("Loaded metadata, duration:", audioRef.current.duration);
      setDuration(audioRef.current.duration);
      setAudioLoading(false);
      setHasError(false);
      
      // Check if the audio is seekable
      if (audioRef.current.seekable && audioRef.current.seekable.length > 0) {
        const seekableEnd = audioRef.current.seekable.end(audioRef.current.seekable.length - 1);
        const seekable = seekableEnd > 0 && !isNaN(seekableEnd);
        setIsSeekable(seekable);
        
        if (!seekable) {
          console.warn("Audio is not seekable. Auto-preloading...");
          // Automatically preload if not seekable
          enableSeekingWorkaround();
        }
      } else {
        setIsSeekable(false);
        console.warn("Audio is not seekable. Auto-preloading...");
        // Automatically preload if not seekable
        enableSeekingWorkaround();
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setHasError(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = (e) => {
    setAudioLoading(false);
    console.error("Error loading audio:", e);
    setIsSeekable(false);
    setHasError(true);
    setErrorMessage("Failed to load audio. The file may be corrupted or unavailable.");
    
    // Try to preload as a fallback
    enableSeekingWorkaround();
  };

  const handleCanPlayThrough = () => {
    setAudioLoading(false);
    setHasError(false);
  };

  // Audio setup effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSegment) return;

    // Set up event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

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

    checkRangeSupport();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [currentSegment]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      tryPlayAudio(audioRef.current);
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current && isSeekable) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addSegment = () => {
    if (segments.length >= 5) return;
    
    const lastSegment = segments[segments.length - 1];
    if (lastSegment.end >= duration) return;
    
    const newSegment = {
      id: segments.length + 1,
      start: lastSegment.end,
      end: duration,
      title: `Segment ${currentSegment.id}_part_${segments.length + 1}`,
      transcribe: true
    };
    setSegments([...segments, newSegment]);
  };

  const updateSegment = (segmentId, updates) => {
    setSegments(segments.map(seg => 
      seg.id === segmentId ? { ...seg, ...updates } : seg
    ));
  };

  const removeSegment = (segmentId) => {
    if (segments.length > 1) {
      setSegments(segments.filter(seg => seg.id !== segmentId));
    }
  };

  // Handle drag start for timeline handles
  const handleDragStart = (segmentId, handleType, clientX, timelineRect) => {
    setIsDragging({ segmentId, handleType });
    
    const handleMouseMove = (moveEvent) => {
      const timeline = document.querySelector('.timeline-container');
      if (!timeline) return;
      
      const currentTimelineRect = timeline.getBoundingClientRect();
      const clickX = moveEvent.clientX - currentTimelineRect.left;
      const percentage = Math.max(0, Math.min(1, clickX / currentTimelineRect.width));
      const newTime = percentage * duration;
      
      const segment = segments.find(seg => seg.id === segmentId);
      if (!segment) return;
      
      if (handleType === 'start') {
        // Ensure start time is at least 0 and less than end time - minimum 1 second
        const newStart = Math.max(0, Math.min(segment.end - 1, newTime));
        updateSegment(segmentId, { start: newStart });
      } else if (handleType === 'end') {
        // Ensure end time is at most duration and greater than start time + minimum 1 second
        const newEnd = Math.max(segment.start + 1, Math.min(duration, newTime));
        updateSegment(segmentId, { end: newEnd });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTimelineClick = (e) => {
    if (isDragging) return; // Don't seek if we're dragging handles
    
    const timeline = e.currentTarget;
    const timelineRect = timeline.getBoundingClientRect();
    const clickX = e.clientX - timelineRect.left;
    const percentage = clickX / timelineRect.width;
    const seekTime = percentage * duration;
    
    handleSeek(seekTime);
  };

  const handleTrim = async () => {
    if (!currentSegment) return;
    
    const split_segments = segments.map(seg => {
      const segmentStart = new Date(currentSegment.start_time);
      const fromTime = new Date(segmentStart.getTime() + seg.start * 1000);
      const toTime = new Date(segmentStart.getTime() + seg.end * 1000);
      
      return {
        from: fromTime.toISOString().slice(0, 19).replace('T', ' '),
        to: toTime.toISOString().slice(0, 19).replace('T', ' '),
        title: seg.title,
        transcribe: seg.transcribe
      };
    });

    const is_active = segments.some(seg => seg.isActive);

    dispatch(trimAudioSegment({
      segment: currentSegment,
      split_segments,
      is_active: isSegmentActive
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        // Preserve current page instead of resetting to 1
        const currentPage = pagination?.current_page || 1;
        
        // Check if V2 filters are active
        const hasV2Filters = (
          (filters.contentTypes && filters.contentTypes.length > 0) ||
          filters.onlyAnnouncers === true ||
          filters.onlyActive === true
        );

        if (hasV2Filters) {
          // Use V2 API with all current filters
          let startDatetime = null;
          let endDatetime = null;
          if (filters.startDate && filters.endDate) {
            const startTime = filters.startTime || '00:00:00';
            const endTime = filters.endTime || '23:59:59';
            startDatetime = convertLocalToUTC(filters.startDate, startTime);
            endDatetime = convertLocalToUTC(filters.endDate, endTime);
          } else if (filters.date) {
            const startTime = filters.startTime || '00:00:00';
            const endTime = filters.endTime || '23:59:59';
            startDatetime = convertLocalToUTC(filters.date, startTime);
            endDatetime = convertLocalToUTC(filters.date, endTime);
          }

          if (startDatetime && endDatetime) {
            // Determine status parameter
            let statusParam = null;
            if (filters.status === 'active' || filters.status === 'inactive') {
              statusParam = filters.status;
            }

            // Determine content types
            let contentTypesToUse = [];
            if (filters.onlyAnnouncers) {
              contentTypesToUse = ['Announcer'];
            } else if (filters.contentTypes && filters.contentTypes.length > 0) {
              contentTypesToUse = filters.contentTypes;
            }

            dispatch(fetchAudioSegmentsV2({
              channelId,
              startDatetime,
              endDatetime,
              page: currentPage,
              shiftId: filters.shiftId || null,
              predefinedFilterId: filters.predefinedFilterId || null,
              contentTypes: contentTypesToUse,
              status: statusParam,
              searchText: filters.searchText || null,
              searchIn: filters.searchIn || null
            }));
          }
        } else {
          // Use V1 API with all current filters
          dispatch(fetchAudioSegments({ 
            channelId: channelId,
            date: filters.date,
            startDate: filters.startDate,
            endDate: filters.endDate,
            startTime: filters.startTime,
            endTime: filters.endTime,
            daypart: filters.daypart,
            searchText: filters.searchText,
            searchIn: filters.searchIn,
            shiftId: filters.shiftId,
            predefinedFilterId: filters.predefinedFilterId,
            duration: filters.duration,
            showFlaggedOnly: filters.showFlaggedOnly || false,
            status: filters.status,
            recognition_status: filters.recognition_status,
            has_content: filters.has_content,
            page: currentPage
          }));
        }
        
        // Close trimmer after a short delay to show success
        setTimeout(() => {
          dispatch(closeTrimmer());
        }, 1000);
      }
    });
  };

  const handleClose = () => {
    dispatch(closeTrimmer());
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Retry loading the audio
  const handleRetry = () => {
    setHasError(false);
    setAudioLoading(true);
    
    // Reset the audio element
    if (audioRef.current) {
      audioRef.current.src = fullSrc;
      audioRef.current.load();
    }
  };

  if (!isOpen || !currentSegment) return null;

  // Fix audio source path - use the same approach as AudioPlayer
  // Use audio_url if available (for podcast segments), otherwise use file_path
  const fullSrc = currentSegment.audio_url 
    ? currentSegment.audio_url 
    : `${import.meta.env.VITE_API_URL}/${currentSegment.file_path}`;
  console.log('Audio source:', fullSrc); // Debug log

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-300 z-40">
      {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-purple-600">
        <div className="flex items-center space-x-4">
            <button 
            onClick={handlePlayPause}
            disabled={hasError || audioLoading}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
            >
            {isPreloading ? (
                <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ) : isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
            ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
            )}
            </button>
            <div className="flex-1">
            <h3 className="font-semibold text-white text-lg">
                Trimming: {currentSegment.title || `Segment ${currentSegment.id}`}
            </h3>
            <p className="text-purple-100 text-sm">
                {hasError ? 'Audio Error' : audioLoading ? 'Loading audio...' : `Duration: ${formatTime(duration)}`} • Drag handles to create multiple segments
            </p>
            </div>
        </div>
        
        <div className="flex items-center space-x-4">
            {/* Show in Dashboard Toggle Switch */}
            <div className="flex items-center space-x-3 bg-white bg-opacity-20 rounded-lg px-4 py-2">
            <span className="text-purple-100 text-sm font-medium whitespace-nowrap">
                Show in Dashboard
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                type="checkbox"
                checked={isSegmentActive}
                onChange={(e) => setIsSegmentActive(e.target.checked)}
                className="sr-only peer"
                />
                <div className="w-11 h-6 bg-purple-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            </div>

            <button
            onClick={addSegment}
            disabled={segments.length >= 5 || !duration}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Segment ({segments.length}/5)</span>
            </button>
            
            <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-purple-400 transition-colors"
            >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>
        </div>

      {/* Audio Loading States */}
      {isPreloading && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center text-blue-700 text-sm">
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Preloading audio for better performance...
          </div>
        </div>
      )}

      {hasError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <div className="flex justify-between items-center">
            <div className="text-red-700 text-sm">
              <strong>Audio Error:</strong> {errorMessage}
            </div>
            <button 
              onClick={handleRetry}
              className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div 
          className="relative h-20 bg-gray-800 rounded-lg overflow-hidden mb-4 timeline-container"
          onClick={handleTimelineClick}
        >
          {/* Waveform */}
          <div className="absolute inset-0 flex items-end justify-between px-2">
            {waveformData.map((height, index) => (
              <div
                key={index}
                className="bg-purple-400 rounded-sm transition-all duration-200 hover:bg-purple-300"
                style={{
                  width: '2px',
                  height: `${height}%`,
                  minHeight: '2px'
                }}
              />
            ))}
          </div>
          
          {/* Segment Areas - Only show if audio is loaded */}
          {!hasError && duration > 0 && segments.map((seg) => (
            <div key={seg.id} className="absolute top-0 bottom-0" 
              style={{
                left: `${(seg.start / duration) * 100}%`,
                width: `${((seg.end - seg.start) / duration) * 100}%`
              }}
            >
              {/* Segment Background */}
              <div className="absolute inset-0 bg-blue-500 bg-opacity-30 border-l-2 border-r-2 border-blue-400"></div>
              
              {/* Start Handle */}
              <div
                className="absolute top-0 bottom-0 left-0 w-3 cursor-col-resize z-10 flex items-center justify-center"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const timelineRect = e.currentTarget.closest('.timeline-container').getBoundingClientRect();
                  handleDragStart(seg.id, 'start', e.clientX, timelineRect);
                }}
              >
                <div className="w-3 h-8 bg-green-500 rounded-l border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-1 h-4 bg-white"></div>
                </div>
              </div>
              
              {/* End Handle */}
              <div
                className="absolute top-0 bottom-0 right-0 w-3 cursor-col-resize z-10 flex items-center justify-center"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const timelineRect = e.currentTarget.closest('.timeline-container').getBoundingClientRect();
                  handleDragStart(seg.id, 'end', e.clientX, timelineRect);
                }}
              >
                <div className="w-3 h-8 bg-red-500 rounded-r border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-1 h-4 bg-white"></div>
                </div>
              </div>
              
              {/* Segment Label */}
              <div className="absolute top-1 left-1 right-1">
                <span className="text-xs text-white font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                  {formatTime(seg.end - seg.start)}
                </span>
              </div>
            </div>
          ))}
          
          {/* Playhead */}
          {!hasError && duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-20 cursor-pointer"
              style={{
                left: `${(currentTime / duration) * 100}%`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-2 -left-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          )}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between text-xs text-gray-600 px-2">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Progress Bar */}
        {!hasError && duration > 0 && (
          <div className="flex items-center space-x-3 mt-3">
            <span className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
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
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime/duration)*100}%, #e5e7eb ${(currentTime/duration)*100}%, #e5e7eb 100%)`
              }}
            />
            <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* Segments Configuration */}
      <div className="p-4 max-h-40 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((seg) => (
            <div key={seg.id} className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={seg.title}
                  onChange={(e) => updateSegment(seg.id, { title: e.target.value })}
                  className="flex-1 text-sm font-medium bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                  placeholder="Segment title"
                />
                {segments.length > 1 && (
                  <button
                    onClick={() => removeSegment(seg.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs mb-2">
                <span>Start: {formatTime(seg.start)}</span>
                <span>End: {formatTime(seg.end)}</span>
              </div>
              
              <div className="text-xs text-center text-gray-600 mb-2">
                Duration: {formatTime(seg.end - seg.start)}
              </div>
              
              <div className="flex items-center justify-center">
                {/* <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={seg.isActive}
                    onChange={(e) => updateSegment(seg.id, { isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">Show in Dashboard</span>
                </label> */}

                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={seg.transcribe}
                        onChange={(e) => updateSegment(seg.id, { transcribe: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-xs">Transcribe</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {segments.length} segment(s) • Total: {formatTime(segments.reduce((acc, seg) => acc + (seg.end - seg.start), 0))}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTrim}
              disabled={isLoading || hasError}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Audio'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => dispatch(clearError())}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
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

export default AudioTrimmer;