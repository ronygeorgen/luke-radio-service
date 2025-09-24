import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../store/slices/topicModalSlice';
import { X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import AudioPlayer from '../../pages/user/AudioPlayer';
import { setCurrentPlaying, setIsPlaying } from '../../store/slices/audioSegmentsSlice';
import TranscriptionModal from '../../pages/user/TranscriptionModal';

const TopicModal = () => {

  const dispatch = useDispatch();
  const { isOpen, topicName, audioSegments, loading, error } = useSelector((state) => state.topicModal);
  const { currentPlayingId, isPlaying } = useSelector((state) => state.audioSegments);
  const apiUrl = import.meta.env.VITE_API_URL || 'https://radio.reloop.pro/api';
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [expandedGeneralTopics, setExpandedGeneralTopics] = useState(new Set());
  const [selectedSegmentForTranscript, setSelectedSegmentForTranscript] = useState(null);

  if (!isOpen) return null;

   // Handler functions for audio playback
  const handlePlayPauseAudio = (segmentId) => {
    if (currentPlayingId === segmentId) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setCurrentPlaying(segmentId));
      dispatch(setIsPlaying(true));
    }
  };

  

  const handleClose = () => {
    dispatch(closeModal());
    setExpandedRows(new Set());
    setExpandedGeneralTopics(new Set());
    // Stop audio when closing modal
    if (currentPlayingId) {
      dispatch(setCurrentPlaying(null));
    }
  };

  const getTitle = (segment) => {
    if (segment.title) return segment.title;
    return `${segment.title_before || ''} ${segment.title_after || ''}`.trim();
  };

  const toggleRowExpansion = (segmentId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(segmentId)) {
      newExpandedRows.delete(segmentId);
    } else {
      newExpandedRows.add(segmentId);
    }
    setExpandedRows(newExpandedRows);
  };

  const toggleGeneralTopicsExpansion = (segmentId) => {
    const newExpandedGeneralTopics = new Set(expandedGeneralTopics);
    if (newExpandedGeneralTopics.has(segmentId)) {
      newExpandedGeneralTopics.delete(segmentId);
    } else {
      newExpandedGeneralTopics.add(segmentId);
    }
    setExpandedGeneralTopics(newExpandedGeneralTopics);
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatGeneralTopics = (topics) => {
    if (!topics) return 'N/A';
    
    // If it's already a formatted list with numbers, return as is
    if (topics.includes('\n') || topics.includes('1.')) {
      return topics.split('\n').map((line, index) => (
        <div key={index} className="mb-1">{line}</div>
      ));
    }
    
    // If it's a comma-separated list, format it with line breaks
    if (topics.includes(',')) {
      return topics.split(',').map((topic, index) => (
        <div key={index} className="mb-1">{topic.trim()}</div>
      ));
    }
    
    // For single topics or other formats
    return topics;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Audio Segments for "{topicName}"
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading audio segments...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && audioSegments.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No audio segments found for this topic.
            </div>
          )}

          {!loading && !error && audioSegments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Play
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Download
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      General Topics
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transcript
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {audioSegments.map((segment) => (
                    <>
                      <tr key={segment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {segment.id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handlePlayPauseAudio(segment.id)}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            aria-label={currentPlayingId === segment.id && isPlaying ? 'Pause' : 'Play'}
                          >
                            {currentPlayingId === segment.id && isPlaying ? (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            )}
                          </button>
                        </td>
                        {/* Download link column (kept for reference) */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <a
                            href={`${apiUrl}/${segment.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 flex items-center"
                            title="Download audio file"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs">
                          <div className="overflow-hidden" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }} title={getTitle(segment)}>
                            {getTitle(segment)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs">
                          <div 
                            className={`overflow-hidden ${expandedGeneralTopics.has(segment.id) ? '' : 'cursor-pointer'}`}
                            style={expandedGeneralTopics.has(segment.id) ? {} : { WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
                            onClick={() => toggleGeneralTopicsExpansion(segment.id)}
                            title={expandedGeneralTopics.has(segment.id) ? '' : 'Click to expand'}
                          >
                            {expandedGeneralTopics.has(segment.id) 
                              ? formatGeneralTopics(segment.analysis?.general_topics)
                              : truncateText(segment.analysis?.general_topics, 80)
                            }
                          </div>
                          {segment.analysis?.general_topics && segment.analysis.general_topics.length > 80 && (
                            <button
                              onClick={() => toggleGeneralTopicsExpansion(segment.id)}
                              className="text-blue-500 text-xs mt-1 flex items-center"
                            >
                              {expandedGeneralTopics.has(segment.id) ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  Show more
                                </>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {segment.analysis?.sentiment || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedSegmentForTranscript(segment)}
                            className="text-blue-500 hover:text-blue-700 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View Transcript
                          </button>
                        </td>
                      </tr>
                      {/* Audio player row for this segment */}
                      {currentPlayingId === segment.id && (
                        <tr key={`${segment.id}-player`}>
                          <td colSpan="7" className="px-4 py-4 bg-gray-50">
                            <div className="flex justify-center w-full">
                              <div className="w-full max-w-2xl">
                                <AudioPlayer 
                                  segment={segment} 
                                  onClose={() => dispatch(setCurrentPlaying(null))}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedRows.has(segment.id) && (
                        <tr key={`${segment.id}-expanded`}>
                          <td colSpan="6" className="px-4 py-4 bg-gray-50">
                            <div className="text-sm text-gray-700">
                              <strong>Full Transcript:</strong>
                              <div className="mt-2 p-3 bg-white border rounded-md whitespace-pre-wrap overflow-auto max-h-64">
                                {segment.transcription?.transcript || 'N/A'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedSegmentForTranscript && (
        <TranscriptionModal 
          transcription={selectedSegmentForTranscript.transcription?.transcript} 
          onClose={() => setSelectedSegmentForTranscript(null)}
        />
      )}
    </div>
  );
};

export default TopicModal;