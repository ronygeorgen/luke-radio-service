// components/UserSide/CompactAudioEditor.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { trimAudioSegment } from '../../store/slices/audioTrimmerSlice';
import { fetchAudioSegments } from '../../store/slices/audioSegmentsSlice';
import { useParams } from 'react-router-dom';

const CompactAudioEditor = ({ isOpen, onClose, segment }) => {
  const dispatch = useDispatch();
  const { channelId: channelIdFromParams } = useParams();
  const channelId = channelIdFromParams || localStorage.getItem('channelId');
  const { filters } = useSelector((state) => state.audioSegments);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState([]);
  const [waveformData, setWaveformData] = useState([]);
  const [isDragging, setIsDragging] = useState(null);
  const [isSeekable, setIsSeekable] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedUrls, setPreloadedUrls] = useState({});
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSegmentActive, setIsSegmentActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fullSrc = useMemo(() => {
    if (!segment) return '';
    return `${import.meta.env.VITE_API_URL}/${segment.file_path}`;
  }, [segment]);

  useEffect(() => {
    if (!isOpen || !segment) return;
    const initialSegment = {
      id: 1,
      start: 0,
      end: segment.duration_seconds || 0,
      title: `Segment ${segment.id}_part_1`,
      transcribe: true,
    };
    setSegments([initialSegment]);
    setIsSegmentActive(true);
    setCurrentTime(0);
    setIsPlaying(false);
    setHasError(false);
    setErrorMessage('');

    // Generate simple mock waveform for compact UI
    const data = [];
    const bars = 160;
    for (let i = 0; i < bars; i++) {
      data.push(20 + Math.random() * 80);
    }
    setWaveformData(data);
  }, [isOpen, segment]);

  const enableSeekingWorkaround = async () => {
    if (!segment || !audioRef.current || !fullSrc) return;
    try {
      setIsPreloading(true);
      setHasError(false);

      if (preloadedUrls[segment.id]) {
        audioRef.current.src = preloadedUrls[segment.id];
        setIsSeekable(true);
        setIsPreloading(false);
        if (isPlaying) {
          try { await audioRef.current.play(); } catch {}
        }
        return;
      }

      const response = await fetch(fullSrc);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreloadedUrls((prev) => ({ ...prev, [segment.id]: blobUrl }));

      const previousTime = audioRef.current.currentTime || 0;
      audioRef.current.src = blobUrl;
      setIsSeekable(true);
      setIsPreloading(false);
      audioRef.current.load();
      audioRef.current.currentTime = previousTime;

      const handleLoad = () => {
        setDuration(audioRef.current.duration || segment.duration_seconds || 0);
        audioRef.current.removeEventListener('loadedmetadata', handleLoad);
        if (isPlaying) {
          audioRef.current.play().catch(() => {});
        }
      };
      audioRef.current.addEventListener('loadedmetadata', handleLoad);
    } catch (err) {
      setIsPreloading(false);
      setHasError(true);
      setErrorMessage('Failed to load audio. The file may be unavailable.');
    }
  };

  const tryPlayAudio = async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setHasError(false);
    } catch (err) {
      setHasError(true);
      setErrorMessage('Failed to play audio. Trying to preload...');
      if (!isSeekable) enableSeekingWorkaround();
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;
    setDuration(isFinite(d) && !isNaN(d) ? d : (segment?.duration_seconds || 0));

    // Very short audio guard: treat as seekable, disable extra checks
    if (d && d <= 1.2) {
      setIsSeekable(true);
      return;
    }

    if (audioRef.current.seekable && audioRef.current.seekable.length > 0) {
      const end = audioRef.current.seekable.end(audioRef.current.seekable.length - 1);
      const seekable = end > 0 && !isNaN(end);
      setIsSeekable(seekable);
      if (!seekable) enableSeekingWorkaround();
    } else {
      setIsSeekable(false);
      enableSeekingWorkaround();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime || 0);
  };

  const handleError = () => {
    setHasError(true);
    setErrorMessage('Audio error encountered. Attempting recovery...');
    setIsSeekable(false);
    enableSeekingWorkaround();
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };

  useEffect(() => {
    if (!isOpen || !segment) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // HEAD check for range support (best-effort)
    (async () => {
      try {
        const res = await fetch(fullSrc, { method: 'HEAD', headers: { Range: 'bytes=0-1' } });
        const acceptsRanges = res.headers.get('accept-ranges') === 'bytes';
        const contentRange = res.headers.get('content-range');
        if (!acceptsRanges && !contentRange) setIsSeekable(false);
      } catch {}
    })();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isOpen, segment, fullSrc]);

  const handleSeek = (time) => {
    if (!audioRef.current) return;
    if (isSeekable) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDragStart = (segmentId, handleType, clientX) => {
    setIsDragging({ segmentId, handleType });
    const handleMouseMove = (moveEvent) => {
      const timeline = document.querySelector('.compact-timeline');
      if (!timeline) return;
      const rect = timeline.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const t = pct * duration;
      const s = segments.find((sg) => sg.id === segmentId);
      if (!s) return;
      if (handleType === 'start') {
        const ns = Math.max(0, Math.min(s.end - 0.3, t));
        setSegments(segments.map((sg) => (sg.id === segmentId ? { ...sg, start: ns } : sg)));
      } else {
        const ne = Math.max(s.start + 0.3, Math.min(duration, t));
        setSegments(segments.map((sg) => (sg.id === segmentId ? { ...sg, end: ne } : sg)));
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

  const addSegment = () => {
    if (segments.length >= 5 || !duration) return;
    const last = segments[segments.length - 1];
    // For compact editor, disallow adding if last already hits end (within 100ms)
    if (last.end >= duration - 0.1) return;
    const newSeg = {
      id: segments.length + 1,
      start: last.end,
      end: duration,
      title: `Segment ${segment.id}_part_${segments.length + 1}`,
      transcribe: true,
    };
    setSegments([...segments, newSeg]);
  };

  const updateSegment = (id, updates) => {
    setSegments(segments.map((sg) => (sg.id === id ? { ...sg, ...updates } : sg)));
  };

  const removeSegment = (id) => {
    if (segments.length <= 1) return;
    setSegments(segments.filter((sg) => sg.id !== id));
  };

  const formatTime = (s) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleSave = async () => {
    if (!segment || isSaving) return;
    setIsSaving(true);
    const segStart = new Date(segment.start_time);
    const split_segments = segments.map((sg) => {
      const fromTime = new Date(segStart.getTime() + sg.start * 1000);
      const toTime = new Date(segStart.getTime() + sg.end * 1000);
      return {
        from: fromTime.toISOString().slice(0, 19).replace('T', ' '),
        to: toTime.toISOString().slice(0, 19).replace('T', ' '),
        title: sg.title,
        transcribe: sg.transcribe,
      };
    });

    try {
      const result = await dispatch(
        trimAudioSegment({ segment, split_segments, is_active: isSegmentActive })
      );
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(
          fetchAudioSegments({
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
            page: 1,
          })
        );
        setTimeout(() => onClose && onClose(), 800);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !segment) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-300 z-40">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (!audioRef.current) return;
                if (isPlaying) audioRef.current.pause(); else tryPlayAudio();
              }}
              disabled={hasError}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
            >
              {isPreloading ? (
                <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              )}
            </button>
            <div>
              <h3 className="font-semibold text-white text-sm md:text-base">Edit: {segment.title || `Segment ${segment.id}`}</h3>
              <p className="text-purple-100 text-xs md:text-sm">{hasError ? 'Audio Error' : `Duration: ${formatTime(duration)}`}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-1.5">
              <span className="text-purple-100 text-xs font-medium whitespace-nowrap">Show in Dashboard</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isSegmentActive} onChange={(e) => setIsSegmentActive(e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-5 bg-purple-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-purple-400 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {isPreloading && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-blue-700 text-xs">Preloading audio for better performance...</div>
        )}
        {hasError && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <div className="text-red-700 text-xs"><strong>Audio Error:</strong> {errorMessage}</div>
            <button onClick={enableSeekingWorkaround} className="ml-2 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium">Retry</button>
          </div>
        )}

        {/* Timeline */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative h-16 md:h-20 bg-gray-800 rounded-lg overflow-hidden mb-3 compact-timeline">
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {waveformData.map((h, i) => (
                <div key={i} className="bg-purple-400 rounded-sm" style={{ width: '2px', height: `${h}%`, minHeight: '2px' }} />
              ))}
            </div>

            {!hasError && duration > 0 && segments.map((sg) => (
              <div key={sg.id} className="absolute top-0 bottom-0" style={{ left: `${(sg.start / duration) * 100}%`, width: `${((sg.end - sg.start) / duration) * 100}%` }}>
                <div className="absolute inset-0 bg-blue-500 bg-opacity-30 border-l-2 border-r-2 border-blue-400"></div>
                <div className="absolute top-0 bottom-0 left-0 w-3 cursor-col-resize z-10 flex items-center justify-center"
                  onMouseDown={(e) => { e.stopPropagation(); handleDragStart(sg.id, 'start', e.clientX); }}>
                  <div className="w-3 h-8 bg-green-500 rounded-l border-2 border-white shadow-lg flex items-center justify-center"><div className="w-1 h-4 bg-white"></div></div>
                </div>
                <div className="absolute top-0 bottom-0 right-0 w-3 cursor-col-resize z-10 flex items-center justify-center"
                  onMouseDown={(e) => { e.stopPropagation(); handleDragStart(sg.id, 'end', e.clientX); }}>
                  <div className="w-3 h-8 bg-red-500 rounded-r border-2 border-white shadow-lg flex items-center justify-center"><div className="w-1 h-4 bg-white"></div></div>
                </div>
                <div className="absolute top-1 left-1 right-1"><span className="text-[10px] text-white font-medium bg-black bg-opacity-50 px-2 py-0.5 rounded">{formatTime(sg.end - sg.start)}</span></div>
              </div>
            ))}

            {!hasError && duration > 0 && (
              <div className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-20" style={{ left: `${(currentTime / duration) * 100}%` }}></div>
            )}
          </div>

          <div className="flex justify-between text-[11px] text-gray-300 px-1"><span>0:00</span><span>{formatTime(duration)}</span></div>

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
                ${isSeekable ? 'bg-gray-200 [&::-webkit-slider-thumb]:bg-blue-500' : 'bg-gray-100 [&::-webkit-slider-thumb]:bg-gray-400'}`}
                style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime/duration)*100}%, #e5e7eb ${(currentTime/duration)*100}%, #e5e7eb 100%)` }}
              />
              <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* Config */}
        <div className="p-4 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {segments.map((sg) => (
              <div key={sg.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <input type="text" value={sg.title} onChange={(e) => updateSegment(sg.id, { title: e.target.value })} className="flex-1 text-sm font-medium bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1" placeholder="Segment title" />
                  {segments.length > 1 && (
                    <button onClick={() => removeSegment(sg.id)} className="ml-2 text-red-500 hover:text-red-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs mb-2"><span>Start: {formatTime(sg.start)}</span><span>End: {formatTime(sg.end)}</span></div>
                <div className="text-xs text-center text-gray-600 mb-2">Duration: {formatTime(sg.end - sg.start)}</div>
                <div className="flex items-center justify-center">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={sg.transcribe} onChange={(e) => updateSegment(sg.id, { transcribe: e.target.checked })} className="rounded" />
                    <span className="text-xs">Transcribe</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{segments.length} segment(s) • Total: {formatTime(segments.reduce((a, sg) => a + (sg.end - sg.start), 0))}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={addSegment} disabled={segments.length >= 5 || !duration} className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-purple-700 border border-purple-200 rounded-md text-sm font-medium disabled:opacity-50">Add Segment ({segments.length}/5)</button>
              <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Audio'}</button>
            </div>
          </div>
        </div>

        <audio ref={audioRef} preload="metadata" src={fullSrc} className="hidden">Your browser does not support the audio element.</audio>
    </div>
  );
};

export default CompactAudioEditor;


