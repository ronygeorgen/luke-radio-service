import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    createReportFolder,
    fetchReportFolders,
    deleteReportFolder,
    updateReportFolder
} from '../../store/slices/reportSlice';
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  FileText,
  ArrowLeft,
  Save,
  X,
  FolderOpen,
  Menu,
  Settings,
  BarChart3,
  Layers,
  UserCog,
  Music,
  LifeBuoy,
  LogOut,
  Clock,
  Filter,
  Radio,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const ReportsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { folders, folderLoading, folderError } = useSelector((state) => state.reports);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isChannelSelectionOpen, setIsChannelSelectionOpen] = useState(false);
  const userChannels = [];

  const channelId = localStorage.getItem('channelId');
  const channelName = localStorage.getItem('channelName');

  useEffect(() => {
    dispatch(fetchReportFolders());
  }, [dispatch]);

  const filteredFolders = folders.filter(folder => {
    return folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           folder.description?.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  const activeReportsCount = folders.length;
  const totalItems = folders.reduce((sum, folder) => sum + (folder.saved_segments_count || 0), 0);

  const handleCreate = () => {
    if (!newName.trim()) return;

    dispatch(createReportFolder({
      name: newName.trim(),
      description: newDescription.trim(),
      channel_id: channelId
    }))
      .unwrap()
      .then(() => {
        setShowCreateModal(false);
        setNewName('');
        setNewDescription('');
      });
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleDelete = (folderId, folderName) => {
    if (window.confirm(`Are you sure you want to delete "${folderName}"?`)) {
      dispatch(deleteReportFolder(folderId));
    }
  };

  const startEditing = (folder) => {
    setEditingFolderId(folder.id);
    setEditName(folder.name);
  };

  const saveEdit = () => {
    if (editName.trim()) {
      dispatch(updateReportFolder({
        id: editingFolderId,
        name: editName.trim()
      }));
      setEditingFolderId(null);
      setEditName('');
    }
  };

  const cancelEdit = () => {
    setEditingFolderId(null);
    setEditName('');
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matching AudioSegmentsPage Style */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 h-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full space-x-4">

            {/* Channel Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                Reports
              </h1>
              {channelName && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {channelName}
                  </span>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reports..."
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-48"
                />
              </div>
            </div>

            {/* Navigation Dropdown - hamburger trigger */}
            <div className="relative">
              <button
                onClick={() => setMenuOpenId(menuOpenId === 'settings' ? null : 'settings')}
                className="flex items-center px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Dropdown Menu - EXACT SAME DESIGN AS BEFORE */}
              {menuOpenId === 'settings' && (
                <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-2 px-2">
                    <div>
                      <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                      <button
                        onClick={() => { navigate('/user-channels'); setMenuOpenId(null); }}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <Radio className="w-4 h-4 mr-3 text-gray-500" />
                        My Channels
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpenId(null);
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
                      <button onClick={() => { navigate("/dashboard"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                        Dashboard
                      </button>
                      <button onClick={() => { navigate("/reports"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <FileText className="w-4 h-4 mr-3 text-gray-500" />
                        Reports
                      </button>
                      <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                        Support Ticket
                      </button>
                    </div>
                    <div>
                      <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                      <button onClick={() => { navigate("/dashboard/settings"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
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
                      <button onClick={() => { navigate("/admin/audio"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Music className="w-4 h-4 mr-3 text-gray-500" />
                        Audio Management
                      </button>
                      <button onClick={() => { navigate("/admin/settings"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Layers className="w-4 h-4 mr-3 text-gray-500" />
                        General Settings
                      </button>
                      <button onClick={() => { navigate("/admin/users"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                        User Management
                      </button>
                      <button onClick={() => { navigate("/admin/users"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Plus className="w-4 h-4 mr-3 text-gray-500" />
                        Create New User
                      </button>
                      <button onClick={() => { navigate("/admin/channels"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Layers className="w-4 h-4 mr-3 text-gray-500" />
                        Channel Settings
                      </button>
                      <button onClick={() => { navigate("/admin/channels"); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <Plus className="w-4 h-4 mr-3 text-gray-500" />
                        Onboard Channel
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button onClick={() => { handleLogout(); setMenuOpenId(null); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
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
      </header>

      {/* Main Content */}
      <main className="pt-20 p-6">
        {/* Page Header with New Report Button */}
        <div className="max-w-[1600px] mx-auto mb-6">
          <div className="flex items-center">

            <button
              onClick={() => setShowCreateModal(true)}
              className="ml-auto bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium 
                        hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 
                        transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>New Report</span>
            </button>
          </div>
        </div>



        {/* Reports Grid */}
        <div className="max-w-[1600px] mx-auto">
          {folderLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-gray-300 rounded-lg p-3 w-12 h-12"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <FileText className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">No reports found</p>
                <p className="text-gray-400 text-sm mb-6">
                  {searchTerm
                    ? 'Try adjusting your search to find what you\'re looking for.'
                    : 'Create your first report to start organizing your audio segments.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Report</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/reports/${folder.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingFolderId === folder.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                                className="flex-1 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                className="flex-1 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{folder.name}</h3>
                            {folder.description && (
                              <p className="text-sm text-gray-500 truncate">{folder.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(folder);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Rename"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(folder.id, folder.name);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Report</h3>
              <p className="text-sm text-gray-600 mt-1">Add a new report to organize your audio segments</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter report name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Add a description..."
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;