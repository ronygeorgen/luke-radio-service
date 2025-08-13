import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchAudioSegments, setCurrentPlaying, setActiveFilter } from '../../store/slices/audioSegmentsSlice';
import AudioPlayer from './AudioPlayer';
import SummaryModal from './SummaryModal';
import TranscriptionModal from './TranscriptionModal';

const AudioSegmentsPage = () => {
  const { channelId } = useParams();
  const [searchParams] = useSearchParams();
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
    activeFilter 
  } = useSelector((state) => state.audioSegments);
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (channelId && date && hour) {
      dispatch(fetchAudioSegments({ channelId, date, hour }));
    }
  }, [channelId, date, hour, dispatch]);

  const filteredSegments = segments.filter(segment => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return segment.is_active;
    return !segment.is_active;
  });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <a href="/reports" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Reports
        </a>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{channelInfo?.channel_name || 'Channel'}</h1>
        <p className="text-gray-600">Hello Steve</p>
        <p className="text-sm text-gray-500">{filteredSegments.length} items</p>
      </div>

      {/* Filter controls */}
      <div className="mb-6 flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <button
          onClick={() => dispatch(setActiveFilter('all'))}
          className={`px-3 py-1 rounded-md text-sm ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          All ({segments.length})
        </button>
        <button
          onClick={() => dispatch(setActiveFilter('active'))}
          className={`px-3 py-1 rounded-md text-sm ${activeFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Active ({segments.filter(s => s.is_active).length})
        </button>
        <button
          onClick={() => dispatch(setActiveFilter('inactive'))}
          className={`px-3 py-1 rounded-md text-sm ${activeFilter === 'inactive' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Inactive ({segments.filter(s => !s.is_active).length})
        </button>
      </div>

      {/* Main content */}
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

            {/* Tab-like headers */}
            <div className="flex mb-6">
              <div className="px-4 py-2 bg-blue-600 text-white rounded-l-md">Details</div>
              <div className="px-4 py-2 bg-blue-100 text-blue-800">Content</div>
              <div className="px-4 py-2 bg-purple-600 text-white rounded-r-md">Metadata</div>
            </div>

            {/* Three-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column - Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date</label>
                  <p className="text-gray-900">{new Date(segment.start_time).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-gray-900">{segment.duration_seconds} seconds</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Sentiment</label>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{segment.analysis?.sentiment || 'N/A'}</span>
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play Audio
                </button>
              </div>

              {/* Middle column - Content */}
              <div className="space-y-4">
                {segment.analysis?.summary && (
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleSummaryClick(segment)}
                  >
                    <h3 className="font-bold text-gray-900">Summary</h3>
                    <p className="text-gray-700 line-clamp-3">{segment.analysis.summary}</p>
                  </div>
                )}
                {segment.transcription?.transcript && (
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleTranscriptionClick(segment)}
                  >
                    <h3 className="font-bold text-gray-900">Transcription</h3>
                    <div className="text-gray-700 line-clamp-3">
                      {segment.transcription.transcript.split('\n').slice(0, 3).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column - Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Topics</label>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    {segment.analysis?.general_topics?.split('\n').length || 0} topics
                  </span>
                </div>
                {segment.analysis && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Wellness Matrix</label>
                      <div className="mt-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Relational Wellness</span>
                          <span>70%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Recreational Wellness</span>
                          <span>45%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Content Type</label>
                      <p className="text-gray-900">News (85%)</p>
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

            {/* Insights section */}
            <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-md p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white">Insights</h3>
                <button className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-3 py-1 rounded-md text-sm">
                  + Add Insight
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Audio Player */}
      {currentPlayingId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4">
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