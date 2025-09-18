// pages/user/ReportDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X,
  Play,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { 
  fetchReportSegments,
  updateReportFolder,
  deleteReportFolder,
  fetchInsights,
  createInsight,
  updateInsight,
  deleteInsight,
  deleteSegmentFromReport,
  clearInsightsError
} from '../../store/slices/reportSlice';
import { setCurrentPlaying, setIsPlaying } from '../../store/slices/audioSegmentsSlice';
import AddInsightModal from '../../components/UserSide/AddInsightModal';
import SummaryModal from './SummaryModal';
import TranscriptionModal from './TranscriptionModal';
import AudioPlayer from './AudioPlayer';
import ReportAudioPlayer from './ReportAudioPlayer';

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { folders, currentReport, segments, insights, insightsLoading, insightsBySegment } = useSelector((state) => state.reports);
  const { currentPlayingId, isPlaying } = useSelector((state) => state.audioSegments);
  
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [expandedInsights, setExpandedInsights] = useState({});
  const [editingInsight, setEditingInsight] = useState(null);
  const [editInsightData, setEditInsightData] = useState({ title: '', description: '' });
  const [showAddInsightModal, setShowAddInsightModal] = useState(false);
  const [selectedSegmentForInsight, setSelectedSegmentForInsight] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const folder = folders.find(f => f.id === parseInt(id)) || currentReport;

  useEffect(() => {
  if (currentPlayingId) {
    const segment = segments.find(s => s.audio_segment_id === currentPlayingId);
    console.log('Current playing segment:', segment);
    console.log('AudioPlayer segment data:', getAudioPlayerSegment(segment));
  }
}, [currentPlayingId, segments]);

  useEffect(() => {
    return () => {
      dispatch(setCurrentPlaying(null));
      dispatch(setIsPlaying(false));
    };
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(fetchReportSegments(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (folder) {
      setEditName(folder.name);
    }
  }, [folder]);

  useEffect(() => {
    if (segments.length > 0) {
      segments.forEach(segment => {
        if (segment.saved_segment_id) {
          dispatch(fetchInsights(segment.saved_segment_id));
        }
      });
    }
  }, [segments, dispatch]);

  const handleSave = () => {
    if (editName.trim()) {
      dispatch(updateReportFolder({
        id: folder.id,
        name: editName.trim()
      }));
      setEditing(false);
    }
  };

  const handleDeleteReport = () => {
    if (window.confirm(`Are you sure you want to delete "${folder.name}"?`)) {
      dispatch(deleteReportFolder(folder.id));
      navigate('/reports');
    }
  };

  const handleDeleteAudioItem = (savedSegmentId, audioTitle) => {
    if (window.confirm(`Are you sure you want to remove "${audioTitle}" from this report?`)) {
      dispatch(deleteSegmentFromReport(savedSegmentId));
    }
  };

  const handlePlayPauseAudio = (segment) => {
    if (currentPlayingId === segment.audio_segment_id) {
      // Toggle play/pause for current segment
      dispatch(setIsPlaying(!isPlaying));
    } else {
      // Play new segment - use audio_segment_id from the API response
      dispatch(setCurrentPlaying(segment.audio_segment_id));
      dispatch(setIsPlaying(true));
    }
  };

  const getAudioPlayerSegment = (segment) => {
    if (!segment) return null;
    
    return {
      id: segment.audio_segment_id, // This is crucial for preloading
      file_path: segment.file_path,
      duration_seconds: segment.duration_seconds,
      start_time: segment.start_time,
      end_time: segment.end_time,
      title: segment.title || segment.audio_segment_title,
      title_before: segment.title_before,
      title_after: segment.title_after,
      // Add any other properties that AudioPlayer might need
      analysis: segment.analysis,
      transcription: segment.transcription
    };
  };

  // Add proper close handler for audio player
  const handleCloseAudioPlayer = () => {
    dispatch(setCurrentPlaying(null));
    dispatch(setIsPlaying(false));
  };

  const handleSummaryClick = (segment) => {
    setSelectedSegment(segment);
    setShowSummaryModal(true);
  };

  const handleTranscriptionClick = (segment) => {
    setSelectedSegment(segment);
    setShowTranscriptionModal(true);
  };

  const toggleInsights = (segmentId) => {
    setExpandedInsights(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };

  const handleAddInsight = (segment) => {
    setSelectedSegmentForInsight(segment);
    setShowAddInsightModal(true);
  };

  const handleEditInsight = (insight) => {
    setEditingInsight(insight.id);
    setEditInsightData({
      title: insight.title,
      description: insight.description || ''
    });
  };

  const handleSaveInsight = (savedSegmentId, insightId) => {
    if (editInsightData.title.trim()) {
      dispatch(updateInsight({
        savedSegmentId,
        insightId,
        insightData: {
          title: editInsightData.title.trim(),
          description: editInsightData.description.trim()
        }
      }))
        .unwrap()
        .then(() => {
          setEditingInsight(null);
          setEditInsightData({ title: '', description: '' });
        });
    }
  };

  const handleCancelEdit = () => {
    setEditingInsight(null);
    setEditInsightData({ title: '', description: '' });
  };

  const handleDeleteInsight = (savedSegmentId, insightId, insightTitle) => {
    if (window.confirm(`Are you sure you want to delete "${insightTitle}"?`)) {
      dispatch(deleteInsight({ savedSegmentId, insightId }));
    }
  };

  const getSegmentInsights = (savedSegmentId) => {
    return insightsBySegment[savedSegmentId] || [];
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSentimentLabel = (sentiment) => {
    if (!sentiment) return 'N/A';
    const score = parseInt(sentiment);
    if (score >= 70) return 'Positive';
    if (score >= 40) return 'Neutral';
    return 'Negative';
  };

  if (!folder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Report not found</p>
          <Link to="/reports" className="text-blue-500 hover:text-blue-600">
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/reports" className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Reports
              </Link>
              <div className="flex items-center space-x-2">
                {editing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold border border-gray-300 rounded px-3 py-1"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{folder.name}</h1>
                )}
                <button
                  onClick={editing ? handleSave : () => setEditing(true)}
                  className="p-1 hover:text-blue-600"
                >
                  {editing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
                {editing && (
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditName(folder.name);
                    }}
                    className="p-1 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{segments.length} items</span>
              <button
                onClick={handleDeleteReport}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Audio Segments List */}
        <div className="space-y-6">
          {segments.map((segment) => (
            <div key={segment.saved_segment_id} className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              {/* Segment Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h6 className="text-sm font-bold text-blue-700 mb-1">
                    Segment ID: {segment.audio_segment_id}
                  </h6>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    {segment.title && segment.title.trim() ? (
                      // Case 1: If original title exists, show it
                      segment.title
                    ) : (
                      // Case 2: Otherwise build from title_before and title_after
                      `${
                        segment.title_before ? "Audio Before: " + segment.title_before : ""
                      }${
                        segment.title_before && segment.title_after ? " - " : ""
                      }${
                        segment.title_after ? "Audio After: " + segment.title_after : ""
                      }`.trim() || "Untitled Report Item"
                    )}
                  </h2>
                </div>
                <button
                  onClick={() => handleDeleteAudioItem(segment.saved_segment_id, segment.audio_segment_title)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Three Column Layout - Matching FullSegment Design */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left column - Details */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
                    Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Date
                    </label>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-800">Start:</span>{" "}
                        {formatDateTime(segment.start_time)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-800">End:</span>{" "}
                        {formatDateTime(segment.end_time)}
                      </p>
                    </div>
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
                          {getSentimentLabel(segment.analysis.sentiment)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                 <button
                  onClick={() => handlePlayPauseAudio(segment)}
                  className={`w-full py-2 px-4 rounded-md flex items-center justify-center text-sm text-white
                    ${
                      currentPlayingId === segment.audio_segment_id && isPlaying
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {currentPlayingId === segment.audio_segment_id && isPlaying ? 'Pause' : 'Play'} Audio
                </button>

                </div>

                {/* Middle column - Content */}
                <div className="md:col-span-7 space-y-4">
                  <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
                    Content
                  </h3>
                  
                  {segment.analysis?.summary && segment.analysis.summary !== "Empty" && (
                    <div className="cursor-pointer" onClick={() => handleSummaryClick(segment)}>
                      <h4 className="font-bold text-gray-900 text-sm">Summary</h4>
                      <p className="text-gray-700 text-sm line-clamp-3">{segment.analysis.summary}</p>
                    </div>
                  )}

                  {segment.transcription?.transcript && segment.transcription.transcript !== "Empty" && (
                    <div className="cursor-pointer" onClick={() => handleTranscriptionClick(segment)}>
                      <h4 className="font-bold text-gray-900 text-sm">Transcription</h4>
                      <div className="text-gray-700 text-sm line-clamp-3">
                        {segment.transcription.transcript.split('\n').slice(0, 3).map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column - Metadata */}
                <div className="md:col-span-3 space-y-4">
                  <h3 className="font-bold text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 py-2 px-4 rounded-md mb-4">
                    Metadata
                  </h3>
                  
                  {segment.analysis && (
                    <>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">General Topics</label>
                          <div className="mt-1 bg-gray-50 p-2 rounded">
                            {segment.analysis.general_topics && segment.analysis.general_topics !== "Empty" ? (
                              segment.analysis.general_topics.split('\n').map((topic, index) => (
                                <div key={index} className="text-sm text-gray-700">{topic}</div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500">No general topics</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500">Bucket Prompt</label>
                          <div className="mt-1 bg-gray-50 p-2 rounded">
                            <div className="text-sm text-gray-700">
                              {segment.analysis.bucket_prompt && segment.analysis.bucket_prompt !== 'Undefined, N/A' 
                                ? segment.analysis.bucket_prompt 
                                : 'Not categorized'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500">IAB Topics</label>
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {segment.analysis?.iab_topics && segment.analysis.iab_topics !== "Empty" 
                            ? segment.analysis.iab_topics 
                            : 'No IAB topics'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Insights Section */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => toggleInsights(segment.saved_segment_id)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    {expandedInsights[segment.saved_segment_id] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>INSIGHTS</span>
                  </button>
                  <button
                    onClick={() => handleAddInsight(segment)}
                    className="flex items-center text-blue-600 text-sm hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Insight
                  </button>
                </div>

                {/* Expanded Insights */}
                {expandedInsights[segment.saved_segment_id] && (
                  <div className="pl-6 mt-2 space-y-3">
                    {(getSegmentInsights(segment.saved_segment_id) || [])
                      .filter(insight => insight && insight.id) .map((insight) => (
                      <div key={insight.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {editingInsight === insight.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editInsightData.title}
                              onChange={(e) => setEditInsightData(prev => ({
                                ...prev,
                                title: e.target.value
                              }))}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Insight title"
                            />
                            <textarea
                              value={editInsightData.description}
                              onChange={(e) => setEditInsightData(prev => ({
                                ...prev,
                                description: e.target.value
                              }))}
                              rows={3}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Insight description"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveInsight(segment.saved_segment_id, insight.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <h6 className="font-medium text-gray-900">{insight.title}</h6>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditInsight(insight)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInsight(segment.saved_segment_id, insight.id, insight.title)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mt-2">{insight.description}</p>
                            <div className="text-xs text-gray-400 mt-2">
                              Added: {formatDateTime(insight.created_at)}
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {getSegmentInsights(segment.saved_segment_id).length === 0 && (
                      <p className="text-gray-500 text-sm italic">No insights yet. Click "Add Insight" to create one.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modals */}
        <AddInsightModal
          isOpen={showAddInsightModal}
          onClose={() => {
            setShowAddInsightModal(false);
            setSelectedSegmentForInsight(null);
          }}
          savedSegmentId={selectedSegmentForInsight?.saved_segment_id}
        />

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

        {/* Audio Player - Fixed to match AudioSegmentsPage */}
        {currentPlayingId && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-30">
            <ReportAudioPlayer 
              segment={segments.find(s => s.audio_segment_id === currentPlayingId)} 
              onClose={handleCloseAudioPlayer}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportDetailPage;