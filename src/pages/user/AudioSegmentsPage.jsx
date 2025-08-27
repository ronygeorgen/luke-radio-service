import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchAudioSegments, setCurrentPlaying, setIsPlaying, setFilter } from '../../store/slices/audioSegmentsSlice';
import { ChevronDown, ChevronUp, Search, Calendar, Filter, RotateCcw, Clock, CheckCircle, X } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import SummaryModal from './SummaryModal';
import TranscriptionModal from './TranscriptionModal';

const AudioSegmentsPage = () => {
  const { channelId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const daypart = searchParams.get('daypart');
  
  const dispatch = useDispatch();
  const { 
    segments, 
    channelInfo, 
    totals, 
    loading, 
    error, 
    currentPlayingId,
    isPlaying,
    filters  
  } = useSelector((state) => state.audioSegments);
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  
  // State for collapsible filters
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  // State for local time inputs (to prevent immediate fetching)
  const [localStartTime, setLocalStartTime] = useState(filters.startTime?.substring(0, 5) || '');
  const [localEndTime, setLocalEndTime] = useState(filters.endTime?.substring(0, 5) || '');

  // Daypart options
  const daypartOptions = [
    { value: 'none', label: 'None', startTime: '', endTime: '' },
    { value: 'morning', label: 'Morning (06:00–10:00)', startTime: '06:00:00', endTime: '10:00:00' },
    { value: 'midday', label: 'Midday (10:00–15:00)', startTime: '10:00:00', endTime: '15:00:00' },
    { value: 'afternoon', label: 'Afternoon (15:00–19:00)', startTime: '15:00:00', endTime: '19:00:00' },
    { value: 'evening', label: 'Evening (19:00–00:00)', startTime: '19:00:00', endTime: '23:59:59' },
    { value: 'overnight', label: 'Overnight (00:00–06:00)', startTime: '00:00:00', endTime: '06:00:00' },
    { value: 'weekend', label: 'Weekend (Saturday & Sunday full day)', startTime: '00:00:00', endTime: '23:59:59' }
  ];

  const handlePlayPauseAudio = (segmentId) => {
    if (currentPlayingId === segmentId) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setCurrentPlaying(segmentId));
      dispatch(setIsPlaying(true));
    }
  };

  // Handle daypart selection
  const handleDaypartChange = (selectedDaypart) => {
    if (selectedDaypart === 'none') {
      dispatch(setFilter({ 
        daypart: 'none',
        startTime: '',
        endTime: ''
      }));
      setLocalStartTime('');
      setLocalEndTime('');
    } else {
      const daypart = daypartOptions.find(opt => opt.value === selectedDaypart);
      dispatch(setFilter({ 
        daypart: selectedDaypart,
        startTime: daypart.startTime,
        endTime: daypart.endTime
      }));
      setLocalStartTime(daypart.startTime.substring(0, 5));
      setLocalEndTime(daypart.endTime.substring(0, 5));
    }
    
    // Fetch immediately when daypart changes
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: filters.date,
      startTime: selectedDaypart === 'none' ? '' : daypart.startTime,
      endTime: selectedDaypart === 'none' ? '' : daypart.endTime
    }));
  };

  // Handle search with custom time
  const handleSearchWithCustomTime = () => {
    dispatch(setFilter({ 
      startTime: localStartTime ? localStartTime + ':00' : '',
      endTime: localEndTime ? localEndTime + ':00' : '',
      daypart: 'none'
    }));
    
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: filters.date,
      startTime: localStartTime ? localStartTime + ':00' : '',
      endTime: localEndTime ? localEndTime + ':00' : ''
    }));
  };

  // Initialize with URL params or defaults
  useEffect(() => {
    let initialDate = searchParams.get('date');
    
    // If date is in YYYYMMDD format, convert to YYYY-MM-DD
    if (initialDate && /^\d{8}$/.test(initialDate)) {
      const year = initialDate.substring(0, 4);
      const month = initialDate.substring(4, 6);
      const day = initialDate.substring(6, 8);
      initialDate = `${year}-${month}-${day}`;
    } else if (!initialDate) {
      initialDate = new Date().toISOString().split('T')[0];
    }

    const initialStartTime = startTime || '';
    const initialEndTime = endTime || '';
    const initialDaypart = daypart || 'none';

    dispatch(setFilter({ 
      date: initialDate,
      startTime: initialStartTime,
      endTime: initialEndTime,
      daypart: initialDaypart
    }));
    
    setLocalStartTime(initialStartTime.substring(0, 5));
    setLocalEndTime(initialEndTime.substring(0, 5));
    
    // Initial fetch
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: initialDate,
      startTime: initialStartTime,
      endTime: initialEndTime
    }));
  }, [channelId]);

  // Fetch data when filters change (only for date and daypart)
  useEffect(() => {
    if (filters.date && (filters.daypart !== 'none' || (!localStartTime && !localEndTime))) {
      dispatch(fetchAudioSegments({ 
        channelId, 
        date: filters.date,
        startTime: filters.startTime,
        endTime: filters.endTime
      }));
      
      // Update URL params
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.startTime) params.startTime = filters.startTime;
      if (filters.endTime) params.endTime = filters.endTime;
      if (filters.daypart && filters.daypart !== 'none') params.daypart = filters.daypart;
      
      setSearchParams(params);
    }
  }, [filters.date, filters.daypart, channelId]);

  // Format time display for header
  const formatTimeDisplay = () => {
    if (filters.daypart && filters.daypart !== 'none') {
      const daypart = daypartOptions.find(opt => opt.value === filters.daypart);
      return daypart.label.split('(')[1].replace(')', '');
    }
    
    if (filters.startTime && filters.endTime) {
      return `${filters.startTime.substring(0, 5)}–${filters.endTime.substring(0, 5)}`;
    }
    
    return 'All day';
  };

  // Filter segments (client-side filtering for status and recognition)
  const filteredSegments = segments.filter(segment => {
    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !segment.is_active) return false;
      if (filters.status === 'inactive' && segment.is_active) return false;
    }
    
    // Recognition filter
    if (filters.recognition !== 'all') {
      const hasContent = segment.analysis?.summary || segment.transcription?.transcript;
      
      switch (filters.recognition) {
        case 'recognized':
          if (!segment.is_recognized) return false;
          break;
        case 'unrecognized':
          if (segment.is_recognized) return false;
          break;
        case 'unrecognized_with_content':
          if (segment.is_recognized || !hasContent) return false;
          break;
        case 'unrecognized_without_content':
          if (segment.is_recognized || hasContent) return false;
          break;
        default:
          break;
      }
    }
    
    return true;
  });

  const formatDateForDisplay = (dateString) => {
    if (dateString.includes('-')) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    try {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      const isoDate = `${year}-${month}-${day}`;
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(isoDate).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  const handlePlayAudio = (segmentId) => {
    dispatch(setCurrentPlaying(segmentId));
  };

  const handleSummaryClick = (segment) => {
    setSelectedSegment(segment);
    setShowSummaryModal(true);
  };

  const handleTranscriptionClick = (segment) => {
    setSelectedSegment(segment);
    setShowTranscriptionModal(true);
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    dispatch(setFilter({
      date: today,
      startTime: '',
      endTime: '',
      daypart: 'none',
      status: 'all',
      recognition: 'all'
    }));
    
    setLocalStartTime('');
    setLocalEndTime('');
    
    // Update URL params
    setSearchParams({ date: today });
    
    // Fetch with reset filters
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: today,
      startTime: '',
      endTime: ''
    }));
  };

  const toggleFilters = () => {
    setIsFiltersExpanded(!isFiltersExpanded);
  };

  // Shimmer effect component
  const SegmentShimmer = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left column shimmer */}
          <div className="md:col-span-2 space-y-4">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          
          {/* Middle column shimmer */}
          <div className="md:col-span-7 space-y-4">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          
          {/* Right column shimmer */}
          <div className="md:col-span-3 space-y-4">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && segments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          
          {[...Array(3)].map((_, i) => (
            <SegmentShimmer key={i} />
          ))}
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <div className="flex items-center py-2">
            <a href="/reports" className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Channels
            </a>
          </div>

          {/* Compact Header Content */}
          <div className="flex items-center justify-between py-3">
            {/* Left side - Channel info */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{channelInfo?.channel_name || 'Channel'}</h1>
              <p className="text-xs text-gray-600 mt-1">
                {formatDateForDisplay(filters.date)} • {formatTimeDisplay()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Collapsible Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Filter Header */}
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={toggleFilters}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-blue-600">Filter Parameters</h2>
            </div>
            {isFiltersExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Expandable Filter Content */}
          {isFiltersExpanded && (
            <div className="border-t border-gray-200 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Date & Time Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Date & Time</h3>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={filters.date}
                      onChange={(e) => dispatch(setFilter({ date: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Daypart Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
                    <select
                      value={filters.daypart || 'none'}
                      onChange={(e) => handleDaypartChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {daypartOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual Time Inputs */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={localStartTime}
                          onChange={(e) => setLocalStartTime(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          disabled={filters.daypart !== 'none'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                        <input
                          type="time"
                          value={localEndTime}
                          onChange={(e) => setLocalEndTime(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          disabled={filters.daypart !== 'none'}
                        />
                      </div>
                    </div>
                    
                    {/* Search Button for Custom Time */}
                    <button
                      onClick={handleSearchWithCustomTime}
                      disabled={filters.daypart !== 'none'}
                      className={`w-full p-3 rounded-lg font-medium ${
                        filters.daypart !== 'none'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } transition-colors`}
                    >
                      Search with Custom Time
                    </button>
                  </div>
                </div>

                {/* Status & Recognition Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <Filter className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Content Filters</h3>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                    <select
                      value={filters.status || 'all'}
                      onChange={(e) => dispatch(setFilter({ status: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="all">All Status ({segments.length})</option>
                      <option value="active">Active ({segments.filter(s => s.is_active).length})</option>
                      <option value="inactive">Inactive ({segments.filter(s => !s.is_active).length})</option>
                    </select>
                  </div>

                  {/* Recognition Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recognition Filter</label>
                      <select
                        value={filters.recognition || 'all'}
                        onChange={(e) => dispatch(setFilter({ recognition: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="all">All Recognition ({segments.length})</option>
                        <option value="recognized">Recognized ({segments.filter(s => s.is_recognized).length})</option>
                        <option value="unrecognized">Unrecognized ({segments.filter(s => !s.is_recognized).length})</option>
                        <option value="unrecognized_with_content">
                          Unrecognized with Content ({
                            segments.filter(s => !s.is_recognized && (s.analysis?.summary || s.transcription?.transcript)).length
                          })
                        </option>
                        <option value="unrecognized_without_content">
                          Unrecognized without Content ({
                            segments.filter(s => !s.is_recognized && !s.analysis?.summary && !s.transcription?.transcript).length
                          })
                        </option>
                      </select>
                    </div>
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleResetFilters}
                  className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all duration-200 mr-4"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Filters
                </button>

                <button
                  onClick={toggleFilters}
                  className="flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close Filter
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Loading shimmer for segments */}
        {loading && segments.length > 0 && (
          <div className="mb-6">
            <SegmentShimmer />
            <SegmentShimmer />
          </div>
        )}

        {/* Audio Segments */}
        {filteredSegments.map((segment) => (
          <div 
            key={segment.id} 
            className={`bg-white rounded-xl shadow-md overflow-hidden mb-6 ${!segment.is_active ? 'opacity-70' : ''}`}
          >
            {segment.analysis?.summary || segment.transcription?.transcript ? (
              // Full layout for segments with summary or transcription
              <div className="p-6">
                {/* Title bar */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    {segment.title || 'Untitled Report Item'}
                  </h2>
                  <div className="flex space-x-2">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {segment.duration_seconds}s
                    </span>
                  </div>
                </div>

                {/* Three-column layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left column - Details (20% width) */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
                      Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date</label>
                      <p className="text-gray-900 text-sm">{new Date(segment.start_time).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Duration</label>
                      <p className="text-gray-900 text-sm">{segment.duration_seconds} seconds</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Sentiment</label>
                      <div className="flex items-center">
                        <span className="text-gray-900 text-sm mr-2">{segment.analysis?.sentiment || 'N/A'}</span>
                        {segment.analysis?.sentiment && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            {segment.analysis.sentiment >= 70 ? 'Positive' : 
                              segment.analysis.sentiment >= 40 ? 'Neutral' : 'Negative'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                        onClick={() => handlePlayPauseAudio(segment.id)}
                        className={`w-full ${
                          currentPlayingId === segment.id && isPlaying 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white py-2 px-4 rounded-md flex items-center justify-center text-sm`}
                      >
                        {currentPlayingId === segment.id && isPlaying ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                            </svg>
                            Pause Audio
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            </svg>
                            Play Audio
                          </>
                        )}
                      </button>
                  </div>

                  {/* Middle column - Content (60% width) */}
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
                      Content
                    </h3>
                    
                    {segment.analysis?.summary && (
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleSummaryClick(segment)}
                      >
                        <h4 className="font-bold text-gray-900 text-sm">Summary</h4>
                        <p className="text-gray-700 text-sm line-clamp-3">{segment.analysis.summary}</p>
                      </div>
                    )}
                    {segment.transcription?.transcript && (
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleTranscriptionClick(segment)}
                      >
                        <h4 className="font-bold text-gray-900 text-sm">Transcription</h4>
                        <div className="text-gray-700 text-sm line-clamp-3">
                          {segment.transcription.transcript.split('\n').slice(0, 3).map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right column - Metadata (20% width) */}
                  <div className="md:col-span-3 space-y-4">
                    <h3 className="font-bold text-center text-white bg-gradient-to-r from-purple-500 to-purple-600 py-2 px-4 rounded-md mb-4">
                      Metadata
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Topics</label>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {segment.analysis?.general_topics?.split('\n').length || 0} topics
                      </span>
                    </div>
                    {segment.analysis && (
                      <>
                      <div className="mt-4 space-y-3">
                        {/* General Topics */}
                        <div>
                          <label className="block text-sm font-medium text-gray-500">General Topics</label>
                          <div className="mt-1 bg-gray-50 p-2 rounded">
                            {segment.analysis.general_topics.split('\n').map((topic, index) => (
                              <div key={index} className="text-sm text-gray-700">
                                {topic}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bucket Prompt */}
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Category</label>
                          <div className="mt-1 bg-gray-50 p-2 rounded">
                            <div className="text-sm text-gray-700">
                              {segment.analysis.bucket_prompt !== 'Undefined, N/A' 
                                ? segment.analysis.bucket_prompt 
                                : 'Not categorized'}
                            </div>
                          </div>
                        </div>
                      </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">IAB Topics</label>
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {segment.analysis?.iab_topics === 'Empty_RESULT' ? 0 : 1} topics
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Compact layout for segments without summary or transcription
              <div className="p-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    {segment.title || 'Untitled Report Item'}
                </h2>
                <div className="flex items-center justify-between">
                  {/* Left side - Audio play button and basic info */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handlePlayPauseAudio(segment.id)}
                      className={`${
                        currentPlayingId === segment.id && isPlaying 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white p-2 rounded-full flex items-center justify-center`}
                    >
                      {currentPlayingId === segment.id && isPlaying ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900">
                        {new Date(segment.start_time).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(segment.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700">
                      {segment.duration_seconds}s
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 mr-1">Sentiment:</span>
                      {segment.analysis?.sentiment ? (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          segment.analysis.sentiment >= 70 
                            ? 'bg-green-100 text-green-800' 
                            : segment.analysis.sentiment >= 40 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {segment.analysis.sentiment >= 70 ? 'Positive' : 
                            segment.analysis.sentiment >= 40 ? 'Neutral' : 'Negative'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Right side - No content available indicator */}
                  <div className="text-sm text-gray-400 italic">
                    No content available
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Audio Player */}
      {currentPlayingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-30">
          <AudioPlayer 
            segment={segments.find(s => s.id === currentPlayingId)} 
            onClose={() => dispatch(setCurrentPlaying(null))}
          />
        </div>
      )}

      {/* Modals */}
      {showSummaryModal && selectedSegment && (
        <SummaryModal 
          summary={selectedSegment.analysis?.summary} 
          onClose={() => setShowSummaryModal(false)}
        />
      )}

      {showTranscriptionModal && selectedSegment && (
        <TranscriptionModal 
          transcription={selectedSegment.transcription?.transcript} 
          onClose={() => setShowTranscriptionModal(false)}
        />
      )}
    </div>
  );
};

export default AudioSegmentsPage;