// pages/user/ReportDetailPage.jsx
import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  Settings,
  Search,
  BarChart3,
  FileText,
  Layers,
  UserCog,
  Music,
  LifeBuoy,
  LogOut,
  Clock,
  Filter,
  Radio,
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
import { logout } from '../../store/slices/authSlice';
import { setCurrentPlaying, setIsPlaying } from '../../store/slices/audioSegmentsSlice';
import AddInsightModal from '../../components/UserSide/AddInsightModal';
import SummaryModal from './SummaryModal';
import TranscriptionModal from './TranscriptionModal';
import AudioPlayer from './AudioPlayer';
import ReportAudioPlayer from './ReportAudioPlayer';
import SimpleChannelSelectionModal from './SimpleChannelSelectionModal';

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { folders, currentReport, segments, insights, insightsLoading, insightsBySegment } = useSelector((state) => state.reports);
  const { currentPlayingId, isPlaying } = useSelector((state) => state.audioSegments);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
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
  const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);
  const userChannels = [];
  const handleChannelSelect = (channel) => {
    try {
      if (channel?.id) localStorage.setItem('channelId', String(channel.id));
      if (channel?.name) localStorage.setItem('channelName', channel.name);
      localStorage.setItem('channelTimezone', channel?.timezone || 'Australia/Melbourne');
    } catch (e) {}
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    navigate(`/channels/${channel.id}/segments?date=${today}&hour=0&name=${encodeURIComponent(channel.name)}`);
    setIsChannelSelectionOpen(false);
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    if (editName.trim()) {
      dispatch(updateReportFolder({
        id: folder.id,
        name: editName.trim()
      }));
      setEditing(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
  };

  const handleDeleteReport = () => {
    if (window.confirm(`Are you sure you want to delete "${folder.name}" folder?`)) {
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

const formatDateTime = (backendTime) => {
  try {
    // Show raw backend timestamp without conversion
    return backendTime; // Shows full timestamp like "2025-10-21T18:30:00.000Z"
  } catch (e) {
    return 'Invalid time';
  }
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
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full space-x-4">

            {/* Report Info */}
            <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-gray-900 truncate">
          {folder.name}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {localStorage.getItem('channelName') || 'Channel'}
          </span>
          <span className="flex items-center">
            <FileText className="w-4 h-4 mr-1 text-gray-400" />
            {segments.length} items
          </span>
        </div>
      </div>

            {/* Right Section - Delete and Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeleteReport}
                className="flex items-center justify-center w-10 h-10 text-red-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Delete report"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              {/* Settings Dropdown - SAME DESIGN AS OTHER PAGES */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Settings className="h-5 w-5" />
                  <span>Navigation</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu - SAME DESIGN AS OTHER PAGES */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-2 px-2">
                      <div>
                        <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            const channelId = localStorage.getItem('channelId');
                            const channelName = localStorage.getItem('channelName');
                            if (channelId && channelName) {
                              const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
                              navigate(`/channels/${channelId}/segments?date=${today}&hour=0&name=${encodeURIComponent(channelName)}`);
                            } else {
                              navigate('/user-channels');
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Search className="w-4 h-4 mr-3 text-gray-500" />
                          Search
                        </button>
                        <button
                          onClick={() => { navigate('/user-channels'); setIsDropdownOpen(false); }}
                          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Radio className="w-4 h-4 mr-3 text-gray-500" />
                          My Channels
                        </button>
                        <button onClick={() => { navigate("/dashboard"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                          Dashboard
                        </button>
                        <button onClick={() => { navigate("/reports"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <FileText className="w-4 h-4 mr-3 text-gray-500" />
                          Reports
                        </button>
                        <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                          Support Ticket
                        </button>
                      </div>
                      <div>
                        <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                        <button onClick={() => { navigate("/dashboard/settings"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Settings className="w-4 h-4 mr-3 text-gray-500" />
                          Topic Settings
                        </button>
                        <button onClick={() => navigate('/dashboard/shift-management')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Clock className="w-4 h-4 mr-3 text-gray-500" />
                        Shift Management
                      </button>
                      <button onClick={() => navigate('/dashboard/predefined-filters')} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Filter className="w-4 h-4 mr-3 text-gray-500" />
                        Predefined Filters
                      </button>
                        <button onClick={() => { navigate("/admin/audio"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Music className="w-4 h-4 mr-3 text-gray-500" />
                          Audio Management
                        </button>
                        <button onClick={() => { navigate("/admin/settings"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Layers className="w-4 h-4 mr-3 text-gray-500" />
                          General Settings
                        </button>
                        <button onClick={() => { navigate("/admin/users"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                          User Management
                        </button>
                        <button onClick={() => { navigate("/admin/users"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Plus className="w-4 h-4 mr-3 text-gray-500" />
                          Create New User
                        </button>
                        <button onClick={() => { navigate("/admin/channels"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Layers className="w-4 h-4 mr-3 text-gray-500" />
                          Channel Settings
                        </button>
                        <button onClick={() => { navigate("/admin/channels"); setIsDropdownOpen(false); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                          <Plus className="w-4 h-4 mr-3 text-gray-500" />
                          Onboard Channel
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h5a2 2 0 002-2V7a2 2 0 00-2-2h-5a2 2 0 00-2 2v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Audio Segments List */}
        <div className="max-w-[1600px] mx-auto mb-6">
          <div className="flex items-center justify-between">
            
              <p className="text-gray-600 w-full text-center ">Showing the reports added in { folder.name } folder </p>
          </div>
        </div>
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