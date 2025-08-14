import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchAudioSegments, setCurrentPlaying, setFilter } from '../../store/slices/audioSegmentsSlice';
import AudioPlayer from './AudioPlayer';
import SummaryModal from './SummaryModal';
import TranscriptionModal from './TranscriptionModal';

const AudioSegmentsPage = () => {
  const { channelId } = useParams();
  const [searchParams, setSearchParams ] = useSearchParams();
  const date = searchParams.get('date');
  const hour = searchParams.get('hour');
  
  const dispatch = useDispatch();
  const { 
    segments, 
    channelInfo, 
    totals, 
    loading, 
    error, 
    currentPlayingId,
    filters  
  } = useSelector((state) => state.audioSegments);
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  
  // Filter panel visibility
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // Collapsible filter states
  const [expandedSections, setExpandedSections] = useState({
    date: true,
    hour: false,
    status: false,
    recognition: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
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

    const initialHour = hour || 'all';
    
    dispatch(setFilter({ 
      date: initialDate,
      hour: initialHour
    }));
    
    // Initial fetch
    dispatch(fetchAudioSegments({ 
      channelId, 
      date: initialDate, 
      hour: initialHour !== 'all' ? initialHour : null 
    }));
  }, [channelId]);

  // Fetch data when date or hour changes
  useEffect(() => {
    if (filters.date) {
      dispatch(fetchAudioSegments({ 
        channelId, 
        date: filters.date, 
        hour: filters.hour !== 'all' ? filters.hour : null 
      }));
      
      // Update URL params
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.hour !== 'all') params.hour = filters.hour;
      setSearchParams(params);
    }
  }, [filters.date, filters.hour, channelId]);

  // Filter segments (client-side filtering for status and recognition)
  const filteredSegments = segments.filter(segment => {
    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !segment.is_active) return false;
      if (filters.status === 'inactive' && segment.is_active) return false;
    }
    
    // Recognition filter
    if (filters.recognition !== 'all') {
      if (filters.recognition === 'recognized' && !segment.is_recognized) return false;
      if (filters.recognition === 'unrecognized' && segment.is_recognized) return false;
    }
    
    return true;
  });

  const formatDateForDisplay = (dateString) => {
    // First, check if the date is already in ISO format (from filters.date)
    if (dateString.includes('-')) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // If it's in the YYYYMMDD format (from URL params)
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
      hour: 'all',
      status: 'all',
      recognition: 'all'
    }));
    
    // Update URL params
    setSearchParams({ date: today });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <div className="flex items-center py-4">
            <a href="/reports" className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Channels
            </a>
          </div>

          {/* Main Header Content */}
          <div className="flex items-center justify-between py-6">
            {/* Left side - Channel info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{channelInfo?.channel_name || 'Channel'}</h1>
              {/* <p className="text-sm text-gray-500 mt-1">{filteredSegments.length} items</p> */}
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  Showing data for: <span className="font-medium text-gray-900">{formatDateForDisplay(filters.date)}</span>
                  {filters.hour !== 'all' && (
                    <span>, Hour: <span className="font-medium text-gray-900">{filters.hour}:00</span></span>
                  )}
                </p>
              </div>
            </div>

            {/* Right side - Filter controls */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  <svg 
                    className={`w-4 h-4 ml-2 transition-transform duration-200 ${isFilterPanelOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Reset Button */}
                <button
                  onClick={handleResetFilters}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-md transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>

              {/* Collapsible Filter Panel */}
              {isFilterPanelOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter Options
                    </h3>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {/* Date Filter */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSection('date')}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-900">Date</span>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.date ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSections.date && (
                        <div className="px-6 pb-4">
                          <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => dispatch(setFilter({ date: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      )}
                    </div>

                    {/* Hour Filter */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSection('hour')}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-900">Hour of Day</span>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.hour ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSections.hour && (
                        <div className="px-6 pb-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => dispatch(setFilter({ hour: 'all' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                filters.hour === 'all' 
                                  ? 'bg-blue-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              All Hours
                            </button>
                            {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                              <button
                                key={hour}
                                onClick={() => dispatch(setFilter({ hour: hour.toString() }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  filters.hour === hour.toString() 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {hour}:00
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSection('status')}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-900">Status</span>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.status ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSections.status && (
                        <div className="px-6 pb-4">
                          <div className="space-y-2">
                            <button
                              onClick={() => dispatch(setFilter({ status: 'all' }))}
                              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                                filters.status === 'all' 
                                  ? 'bg-purple-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              All ({segments.length})
                            </button>
                            <button
                              onClick={() => dispatch(setFilter({ status: 'active' }))}
                              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                                filters.status === 'active' 
                                  ? 'bg-purple-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Active ({segments.filter(s => s.is_active).length})
                            </button>
                            <button
                              onClick={() => dispatch(setFilter({ status: 'inactive' }))}
                              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                                filters.status === 'inactive' 
                                  ? 'bg-purple-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Inactive ({segments.filter(s => !s.is_active).length})
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recognition Filter */}
                    <div>
                      <button
                        onClick={() => toggleSection('recognition')}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-900">Recognition</span>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.recognition ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSections.recognition && (
                        <div className="px-6 pb-4">
                          <div className="space-y-2">
                            <button
                              onClick={() => dispatch(setFilter({ recognition: 'all' }))}
                              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                                filters.recognition === 'all' 
                                  ? 'bg-amber-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              All ({segments.length})
                            </button>
                            <button
                              onClick={() => dispatch(setFilter({ recognition: 'recognized' }))}
                              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                                filters.recognition === 'recognized' 
                                  ? 'bg-amber-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Recognized ({segments.filter(s => s.is_recognized).length})
                            </button>
                            <button
                              onClick={() => dispatch(setFilter({ recognition: 'unrecognized' }))}
                              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all duration-200 ${
                                filters.recognition === 'unrecognized' 
                                  ? 'bg-amber-600 text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Unrecognized ({segments.filter(s => !s.is_recognized).length})
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredSegments.map((segment) => (
          <div 
            key={segment.id} 
            className={`bg-white rounded-xl shadow-md overflow-hidden mb-6 ${!segment.is_active ? 'opacity-70' : ''}`}
          >
            <div className="p-6">
              {/* Title bar */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  {segment.title || 'Untitled Report Item'}
                  <button className="ml-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
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
                    onClick={() => handlePlayAudio(segment.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Play Audio
                  </button>
                </div>

                {/* Middle column - Content (60% width) */}
                <div className="md:col-span-7 space-y-4">
                  <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
                    Content
                  </h3>
                  
                  {segment.analysis?.summary || segment.transcription?.transcript ? (
                    <>
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
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <svg 
                        className="w-12 h-12 mb-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <p className="text-sm">No content available for this segment</p>
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
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-500">Wellness Matrix</label>
                        <div className="mt-1">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Relational</span>
                            <span>70%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Recreational</span>
                            <span>45%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                      </div> */}
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-500">Content Type</label>
                        <p className="text-gray-900 text-sm">News (85%)</p>
                      </div> */}
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

              {/* Insights section */}
              {/* <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white">Insights</h3>
                  <button className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-3 py-1 rounded-md text-sm">
                    + Add Insight
                  </button>
                </div>
              </div> */}
            </div>
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