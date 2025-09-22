  // pages/user/ReportsPage.jsx
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
    X
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


    useEffect(() => {
      dispatch(fetchReportFolders());
    }, [dispatch]);

    const filteredFolders = folders.filter(folder => {
      const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          folder.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArchiveFilter = showArchived ? true : !folder.is_archived;
      return matchesSearch && matchesArchiveFilter;
    });

    const activeReportsCount = folders.filter(folder => !folder.is_archived).length;

    const handleCreate = () => {
      if (!newName.trim()) return;

      dispatch(createReportFolder({
        name: newName.trim(),
        description: newDescription.trim()
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Channels
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </button>
              {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-4">Create New Report</h2>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter report name"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                        rows="3"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                  <div className="bg-white shadow-sm border-b border-gray-200 p-3 flex justify-end">
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition duration-200 ease-in-out flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 002 2h5a2 2 0 002-2V7a2 2 0 00-2-2h-5a2 2 0 00-2 2v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>

                </div>
                
              )}

            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-4 ml-4">
                <span className="text-sm text-gray-600">{activeReportsCount} active</span>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {showArchived ? 'Show All' : 'Hide Archived'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Reports</h2>
            
            {folderLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            )}

            {!folderLoading && filteredFolders.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reports found. Create your first report to get started.</p>
              </div>
            )}

            {!folderLoading && filteredFolders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow relative group"
                    style={{
                      borderLeft: `4px solid ${folder.color || '#3B82F6'}`,
                      background: folder.is_archived ? '#f9fafb' : 'white'
                    }}
                  >
                    {/* Folder Menu */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === folder.id ? null : folder.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      {menuOpenId === folder.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                navigate(`/reports/${folder.id}`);
                                setMenuOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Report
                            </button>
                            <button
                              onClick={() => {
                                startEditing(folder);
                                setMenuOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit Report
                            </button>
                            <button
                              onClick={() => {
                                handleArchive(folder.id, folder.is_archived);
                                setMenuOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              {folder.is_archived ? 'Unarchive' : 'Archive'} Report
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(folder.id, folder.name);
                                setMenuOpenId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Folder Content */}
                    <div className="mb-4">
                      {editingFolderId === folder.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            autoFocus
                          />
                          <button
                            onClick={saveEdit}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                          {folder.description && (
                            <p className="text-sm text-gray-600 mt-1">{folder.description}</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Folder Footer */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{folder.saved_segments_count || 0} items</span>
                      <span>
                        Updated {new Date(folder.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => navigate(`/reports/${folder.id}`)}
                      className="w-full mt-4 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  };

  export default ReportsPage;