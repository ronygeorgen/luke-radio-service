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
  Archive,
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
  Filter,
  LogOut,
  Users,
  Calendar,
  TrendingUp,
  Grid3x3,
  LayoutList,
  SortAsc,
  Settings,
  ChevronDown,
  BarChart3,
  Layers,
  UserCog,
  Music,
  LifeBuoy,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const ReportsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { folders, folderLoading, folderError } = useSelector((state) => state.reports);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('updated');

  const channelId = localStorage.getItem('channelId');
  const channelName = localStorage.getItem('channelName');

  useEffect(() => {
    dispatch(fetchReportFolders());
  }, [dispatch]);

  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        folder.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchiveFilter = showArchived ? true : !folder.is_archived;
    return matchesSearch && matchesArchiveFilter;
  }).sort((a, b) => {
    if (sortBy === 'updated') {
      return new Date(b.updated_at) - new Date(a.updated_at);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'items') {
      return (b.saved_segments_count || 0) - (a.saved_segments_count || 0);
    }
    return 0;
  });

  const activeReportsCount = folders.filter(folder => !folder.is_archived).length;
  const archivedReportsCount = folders.filter(folder => folder.is_archived).length;
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

  const handleArchive = (folderId, isCurrentlyArchived) => {
    dispatch(updateReportFolder({
      id: folderId,
      is_archived: !isCurrentlyArchived
    }));
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

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sleek Header */}
      <div className="bg-white border-b border-[#E9ECEF] sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-12">
              <Link
                to={`/channels/${channelId}/segments`}
                className="flex items-center text-sm font-medium text-[#6C757D] hover:text-[#212529] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </Link>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4B7DF5] to-[#3A63E0] rounded-2xl blur opacity-75"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-[#4B7DF5] to-[#3A63E0] rounded-2xl flex items-center justify-center shadow-lg">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#212529] tracking-tight">Reports</h1>
                  {channelName && (
                    <div className="flex items-center text-sm text-[#6C757D] mt-0.5">
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      {channelName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
  <button
    onClick={() => setShowCreateModal(true)}
    className="bg-gradient-to-r from-[#4B7DF5] to-[#3A63E0] hover:from-[#3A63E0] hover:to-[#2B6AE1] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2 shadow-lg shadow-[#4B7DF5]/20 hover:shadow-xl hover:shadow-[#4B7DF5]/30 hover:scale-105 active:scale-95 transition-all duration-200"
  >
    <Plus className="w-5 h-5" />
    <span>New Report</span>
  </button>

  <div className="relative">
    <button
      onClick={() => setMenuOpenId(menuOpenId === 'settings' ? null : 'settings')}
      className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      <Settings className="h-5 w-5" />
      <span>Navigation</span>
      <ChevronDown className={`h-4 w-4 transition-transform ${menuOpenId === 'settings' ? 'rotate-180' : ''}`} />
    </button>

    {menuOpenId === 'settings' && (
      <>
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuOpenId(null)}
        ></div>
        <div className="absolute right-0 mt-1 w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 z-30">
          <div className="py-3">
            <div className="grid grid-cols-2 gap-2 px-2">
              <div>
                <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Channels</div>
                <button onClick={() => { navigate('/user-channels'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Search className="w-4 h-4 mr-3 text-gray-500" />
                  Search
                </button>
                <button onClick={() => { navigate('/dashboard'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <BarChart3 className="w-4 h-4 mr-3 text-gray-500" />
                  Dashboard
                </button>
                <button onClick={() => { navigate('/reports'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <FileText className="w-4 h-4 mr-3 text-gray-500" />
                  Reports
                </button>
                <button onClick={() => { window.open('https://forms.clickup.com/9003066468/f/8c9zt34-21136/O2BX6CH5IROJJDHYMW', '_blank', 'noopener,noreferrer'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <LifeBuoy className="w-4 h-4 mr-3 text-gray-500" />
                  Support Ticket
                </button>
              </div>
              <div>
                <div className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Settings</div>
                <button onClick={() => { navigate('/dashboard/settings'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-4 h-4 mr-3 text-gray-500" />
                  Topic Settings
                </button>
                <button onClick={() => { navigate('/admin/audio'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Music className="w-4 h-4 mr-3 text-gray-500" />
                  Audio Management
                </button>
                <button onClick={() => { navigate('/admin/settings'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Layers className="w-4 h-4 mr-3 text-gray-500" />
                  General Settings
                </button>
                <button onClick={() => { navigate('/admin/users'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <UserCog className="w-4 h-4 mr-3 text-gray-500" />
                  User Management
                </button>
                <button onClick={() => { navigate('/admin/users'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Plus className="w-4 h-4 mr-3 text-gray-500" />
                  Create New User
                </button>
                <button onClick={() => { navigate('/admin/channels'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Layers className="w-4 h-4 mr-3 text-gray-500" />
                  Channel Settings
                </button>
                <button onClick={() => { navigate('/admin/channels'); setMenuOpenId(null); }} className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Plus className="w-4 h-4 mr-3 text-gray-500" />
                  Onboard Channel
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <button onClick={() => { handleLogout(); setMenuOpenId(null); }} className="mx-2 mb-1 flex items-center w-[calc(100%-1rem)] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </>
    )}
  </div>
</div>
          </div>
        </div>
      </div>

      {/* Insights Bar */}
      <div className="bg-white border-b border-[#E9ECEF]">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <FileText className="w-6 h-6 text-[#4B7DF5]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#212529]">{activeReportsCount}</div>
                <div className="text-sm text-[#6C757D]">Active Reports</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-br from-[#E2E6EA] to-slate-100 border border-[#E2E6EA]">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Archive className="w-6 h-6 text-[#6C757D]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#212529]">{archivedReportsCount}</div>
                <div className="text-sm text-[#6C757D]">Archived</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-br from-[#D6C1F2] to-purple-50 border border-[#D6C1F2]">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-[#4B7DF5]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#212529]">{totalItems}</div>
                <div className="text-sm text-[#6C757D]">Total Items</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-[#E9ECEF] sticky top-20 z-30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search reports by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:ring-2 focus:ring-[#4B7DF5]/20 focus:border-[#4B7DF5] focus:bg-white transition-all text-[#212529] placeholder:text-[#6C757D]"
                />
              </div>

              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-2 font-medium transition-all whitespace-nowrap ${
                  showArchived
                    ? 'bg-gradient-to-r from-[#4B7DF5] to-[#3A63E0] border-[#4B7DF5] text-white shadow-lg shadow-[#4B7DF5]/25'
                    : 'bg-white border-[#E9ECEF] text-[#6C757D] hover:border-[#6C757D]'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>{showArchived ? 'Archived' : 'All'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 ml-6">
              <div className="flex items-center bg-[#F8F9FA] rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#212529] shadow-sm'
                      : 'text-[#6C757D] hover:text-[#212529]'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-[#212529] shadow-sm'
                      : 'text-[#6C757D] hover:text-[#212529]'
                  }`}
                  title="List view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-white border-2 border-[#E9ECEF] rounded-xl text-sm font-medium text-[#212529] hover:border-[#6C757D] transition-all cursor-pointer focus:ring-2 focus:ring-[#4B7DF5]/20 focus:border-[#4B7DF5]"
              >
                <option value="updated">Last Updated</option>
                <option value="name">Name (A-Z)</option>
                <option value="items">Item Count</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {folderLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-3'
          }>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`bg-white rounded-2xl border-2 border-[#E9ECEF] animate-pulse ${
                viewMode === 'grid' ? 'p-6' : 'p-5'
              }`}>
                <div className="h-6 bg-[#E2E6EA] rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-[#E2E6EA] rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-[#E2E6EA] rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4B7DF5] to-[#3A63E0] rounded-3xl blur-xl opacity-20"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center">
                <FileText className="w-10 h-10 text-[#4B7DF5]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#212529] mb-2">No reports found</h3>
            <p className="text-[#6C757D] mb-8 max-w-md mx-auto">
              {searchTerm || showArchived
                ? 'Try adjusting your search or filter to find what you\'re looking for.'
                : 'Create your first report to start organizing and analyzing your data.'
              }
            </p>
            {!searchTerm && !showArchived && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#4B7DF5] to-[#3A63E0] hover:from-[#3A63E0] hover:to-[#2B6AE1] text-white px-8 py-4 rounded-xl font-semibold inline-flex items-center space-x-2 shadow-lg shadow-[#4B7DF5]/25 hover:shadow-xl hover:shadow-[#4B7DF5]/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Report</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="group bg-white rounded-2xl border-2 border-[#E9ECEF] hover:border-[#4B7DF5] hover:shadow-xl hover:shadow-[#4B7DF5]/10 transition-all duration-300 relative overflow-hidden"
              >
                {folder.is_archived && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6C757D] to-[#212529]"></div>
                )}
                {!folder.is_archived && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4B7DF5] to-[#3A63E0]"></div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      folder.is_archived
                        ? 'bg-[#E2E6EA] text-[#6C757D]'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-[#2B6AE1] border border-blue-200'
                    }`}>
                      {folder.is_archived ? (
                        <>
                          <Archive className="w-3 h-3 mr-1.5" />
                          Archived
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-[#4B7DF5] rounded-full mr-1.5 animate-pulse"></div>
                          Active
                        </>
                      )}
                    </div>

                    <div className="relative">
                      {editingFolderId !== folder.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === folder.id ? null : folder.id);
                          }}
                          className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4 text-[#6C757D]" />
                        </button>
                      )}

                      {menuOpenId === folder.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setMenuOpenId(null)}
                          ></div>
                          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-2xl border border-[#E9ECEF] z-30">
                            <div className="py-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/reports/${folder.id}`);
                                  setMenuOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#F8F9FA] transition-colors"
                              >
                                <Eye className="w-4 h-4 mr-3 text-[#6C757D]" />
                                View Report
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(folder);
                                  setMenuOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#F8F9FA] transition-colors"
                              >
                                <Edit3 className="w-4 h-4 mr-3 text-[#6C757D]" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(folder.id, folder.is_archived);
                                  setMenuOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#F8F9FA] transition-colors"
                              >
                                <Archive className="w-4 h-4 mr-3 text-[#6C757D]" />
                                {folder.is_archived ? 'Unarchive' : 'Archive'}
                              </button>
                              <div className="border-t border-[#E9ECEF] my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(folder.id, folder.name);
                                  setMenuOpenId(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Report
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {editingFolderId === folder.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border-2 border-[#E9ECEF] rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#4B7DF5]/20 focus:border-[#4B7DF5]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={saveEdit}
                          className="flex-1 py-2 bg-gradient-to-r from-[#4B7DF5] to-[#3A63E0] text-white rounded-xl font-semibold text-sm hover:from-[#3A63E0] hover:to-[#2B6AE1] transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 py-2 bg-[#E2E6EA] text-[#212529] rounded-xl font-semibold text-sm hover:bg-[#6C757D] hover:text-white transition-all flex items-center justify-center space-x-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-[#212529] text-lg leading-tight mb-2 line-clamp-2">
                        {folder.name}
                      </h3>
                      {folder.description && (
                        <p className="text-sm text-[#6C757D] leading-relaxed line-clamp-2 mb-4">
                          {folder.description}
                        </p>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#E9ECEF] mt-4">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-[#6C757D]">
                        <FileText className="w-4 h-4 mr-1.5 text-[#6C757D]" />
                        <span className="font-semibold">{folder.saved_segments_count || 0}</span>
                      </div>
                      <div className="flex items-center text-[#6C757D]">
                        <Calendar className="w-4 h-4 mr-1.5 text-[#6C757D]" />
                        <span className="text-xs">
                          {folder.updated_at.split('T')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/reports/${folder.id}`)}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-[#F8F9FA] to-[#E2E6EA] hover:from-blue-50 hover:to-indigo-50 border-2 border-[#E9ECEF] hover:border-[#4B7DF5] rounded-xl text-sm font-semibold text-[#212529] hover:text-[#2B6AE1] transition-all flex items-center justify-center space-x-2 group/btn"
                  >
                    <span>Open Report</span>
                    <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="group bg-white rounded-xl border-2 border-[#E9ECEF] hover:border-[#4B7DF5] hover:shadow-lg hover:shadow-[#4B7DF5]/10 transition-all duration-200 relative overflow-hidden"
              >
                {folder.is_archived && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#6C757D] to-[#212529]"></div>
                )}
                {!folder.is_archived && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#4B7DF5] to-[#3A63E0]"></div>
                )}

                <div className="flex items-center justify-between p-5 pl-6">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                      folder.is_archived
                        ? 'bg-[#E2E6EA] text-[#6C757D]'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-[#2B6AE1] border border-blue-200'
                    }`}>
                      {folder.is_archived ? (
                        <>
                          <Archive className="w-3 h-3 mr-1.5" />
                          Archived
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-[#4B7DF5] rounded-full mr-1.5 animate-pulse"></div>
                          Active
                        </>
                      )}
                    </div>

                    {editingFolderId === folder.id ? (
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 border-2 border-[#E9ECEF] rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-[#4B7DF5]/20 focus:border-[#4B7DF5]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-gradient-to-r from-[#4B7DF5] to-[#3A63E0] text-white rounded-xl font-semibold text-sm hover:from-[#3A63E0] hover:to-[#2B6AE1] transition-all flex items-center space-x-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-[#E2E6EA] text-[#212529] rounded-xl font-semibold text-sm hover:bg-[#6C757D] hover:text-white transition-all flex items-center space-x-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#212529] text-base truncate mb-1">
                            {folder.name}
                          </h3>
                          {folder.description && (
                            <p className="text-sm text-[#6C757D] truncate">
                              {folder.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-6 text-sm shrink-0">
                          <div className="flex items-center text-[#6C757D]">
                            <FileText className="w-4 h-4 mr-2 text-[#6C757D]" />
                            <span className="font-semibold">{folder.saved_segments_count || 0} items</span>
                          </div>
                          <div className="flex items-center text-[#6C757D]">
                            <Calendar className="w-4 h-4 mr-2 text-[#6C757D]" />
                            <span>
                              {folder.updated_at.split('T')[0]}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {editingFolderId !== folder.id && (
                    <div className="flex items-center space-x-2 ml-4 shrink-0">
                      <button
                        onClick={() => navigate(`/reports/${folder.id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-[#F8F9FA] to-[#E2E6EA] hover:from-blue-50 hover:to-indigo-50 border-2 border-[#E9ECEF] hover:border-[#4B7DF5] rounded-xl text-sm font-semibold text-[#212529] hover:text-[#2B6AE1] transition-all flex items-center space-x-2"
                      >
                        <span>Open</span>
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === folder.id ? null : folder.id);
                          }}
                          className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-all"
                        >
                          <MoreVertical className="w-4 h-4 text-[#6C757D]" />
                        </button>

                        {menuOpenId === folder.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setMenuOpenId(null)}
                            ></div>
                            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-2xl border border-[#E9ECEF] z-30">
                              <div className="py-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(folder);
                                    setMenuOpenId(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#F8F9FA] transition-colors"
                                >
                                  <Edit3 className="w-4 h-4 mr-3 text-[#6C757D]" />
                                  Rename
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(folder.id, folder.is_archived);
                                    setMenuOpenId(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#F8F9FA] transition-colors"
                                >
                                  <Archive className="w-4 h-4 mr-3 text-[#6C757D]" />
                                  {folder.is_archived ? 'Unarchive' : 'Archive'}
                                </button>
                                <div className="border-t border-[#E9ECEF] my-1"></div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(folder.id, folder.name);
                                    setMenuOpenId(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mr-3" />
                                  Delete Report
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all">
            <div className="p-8 border-b border-[#E9ECEF]">
              <div className="flex items-center space-x-4 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4B7DF5] to-[#3A63E0] rounded-2xl blur opacity-75"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-[#4B7DF5] to-[#3A63E0] rounded-2xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#212529]">Create New Report</h2>
                  <p className="text-sm text-[#6C757D] mt-0.5">Add a new report to your channel</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#212529] mb-2">Report Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border-2 border-[#E9ECEF] rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#4B7DF5]/20 focus:border-[#4B7DF5] transition-all text-[#212529] placeholder:text-[#6C757D]"
                  placeholder="e.g., Q4 Sales Report"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#212529] mb-2">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border-2 border-[#E9ECEF] rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#4B7DF5]/20 focus:border-[#4B7DF5] transition-all resize-none text-[#212529] placeholder:text-[#6C757D]"
                  placeholder="Add a brief description of what this report contains..."
                  rows="4"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-8 border-t border-[#E9ECEF] bg-[#F8F9FA] rounded-b-3xl">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="px-6 py-3 border-2 border-[#E9ECEF] rounded-xl text-[#6C757D] hover:bg-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-8 py-3 bg-gradient-to-r from-[#4B7DF5] to-[#3A63E0] hover:from-[#3A63E0] hover:to-[#2B6AE1] text-white rounded-xl font-semibold shadow-lg shadow-[#4B7DF5]/25 hover:shadow-xl hover:shadow-[#4B7DF5]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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