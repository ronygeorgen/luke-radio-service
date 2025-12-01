// pages/admin/CustomFlagsPage.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Flag, Plus, RefreshCw, Edit3, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { 
  fetchCustomFlags, 
  createCustomFlag, 
  updateCustomFlag,
  deleteCustomFlag,
  clearError
} from '../../store/slices/customFlagSlice';
import { fetchChannels } from '../../store/slices/channelSlice';
import CustomFlagModal from './CustomFlagModal';

const CustomFlagsPage = () => {
  const dispatch = useDispatch();
  const { flags, loading, error, createLoading, updateLoading, deleteLoading } = useSelector(state => state.customFlags);
  const { channels } = useSelector(state => state.channels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchCustomFlags());
    dispatch(fetchChannels());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchCustomFlags());
  };

  const handleCreateFlag = () => {
    setEditingFlag(null);
    setIsModalOpen(true);
    dispatch(clearError());
  };

  const handleEditFlag = (flag) => {
    setEditingFlag(flag);
    setIsModalOpen(true);
    dispatch(clearError());
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFlag(null);
  };

  const handleSubmit = (flagData) => {
    if (editingFlag) {
      dispatch(updateCustomFlag({ id: editingFlag.id, flagData }))
        .unwrap()
        .then(() => {
          setIsModalOpen(false);
          setEditingFlag(null);
          dispatch(fetchCustomFlags());
        })
        .catch((error) => {
          console.error('Failed to update flag:', error);
        });
    } else {
      dispatch(createCustomFlag(flagData))
        .unwrap()
        .then(() => {
          setIsModalOpen(false);
          dispatch(fetchCustomFlags());
        })
        .catch((error) => {
          console.error('Failed to create flag:', error);
        });
    }
  };

  const handleDeleteFlag = (flag) => {
    if (window.confirm(`Are you sure you want to delete the flag "${flag.name}"? This action cannot be undone.`)) {
      dispatch(deleteCustomFlag(flag.id))
        .unwrap()
        .then(() => {
          dispatch(fetchCustomFlags());
        })
        .catch((error) => {
          console.error('Failed to delete flag:', error);
        });
    }
  };

  const getChannelName = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    return channel ? channel.name : `Channel ${channelId}`;
  };

  // Filter flags based on search query
  const filteredFlags = flags.filter(flag => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = flag.name?.toLowerCase().includes(query);
    const channelName = getChannelName(flag.channel);
    const channelMatch = channelName.toLowerCase().includes(query);
    return nameMatch || channelMatch;
  });

  if (loading && flags.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateFlag}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Flag</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {flags.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom flags found</h3>
            <p className="text-gray-600">Custom flags will appear here once they are created.</p>
          </div>
        </div>
      ) : filteredFlags.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No flags found</h3>
            <p className="text-gray-600">No flags match your search criteria.</p>
          </div>
        </div>
      ) : (
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead className="sw-thead">
              <tr>
                <th className="sw-th">Name</th>
                <th className="sw-th">Channel</th>
                <th className="sw-th">Transcription Keywords</th>
                <th className="sw-th">Summary Keywords</th>
                <th className="sw-th">IAB Topics</th>
                <th className="sw-th">General Topics</th>
                <th className="sw-th">Sentiment Range</th>
                <th className="sw-th">Status</th>
                <th className="sw-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="sw-tbody">
              {filteredFlags.map((flag) => (
                <tr key={flag.id} className="sw-tr">
                  <td className="sw-td">
                    <div className="text-sm font-medium text-gray-900">{flag.name}</div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-900">{getChannelName(flag.channel)}</div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-600">
                      {flag.transcription_keywords && flag.transcription_keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(flag.transcription_keywords[0]) 
                            ? flag.transcription_keywords.map((group, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {Array.isArray(group) ? group.join(', ') : group}
                                </span>
                              ))
                            : flag.transcription_keywords.map((kw, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {kw}
                                </span>
                              ))
                          }
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-600">
                      {flag.summary_keywords && flag.summary_keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {flag.summary_keywords.map((kw, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-600">
                      {flag.iab_topics && flag.iab_topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {flag.iab_topics.map((topic, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-600">
                      {flag.general_topics && flag.general_topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {flag.general_topics.map((topic, idx) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-600">
                      {flag.sentiment_min !== null && flag.sentiment_max !== null ? (
                        <span>{flag.sentiment_min} to {flag.sentiment_max}</span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="sw-td">
                    <div className="flex items-center">
                      {flag.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${flag.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {flag.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="sw-td whitespace-nowrap text-sm font-medium text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditFlag(flag)}
                        className="px-2 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center justify-center"
                        title="Edit Flag"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlag(flag)}
                        disabled={deleteLoading}
                        className="px-2 py-2 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center"
                        title="Delete Flag"
                      >
                        {deleteLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomFlagModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        flag={editingFlag}
        onSubmit={handleSubmit}
        loading={createLoading || updateLoading}
        error={error}
      />
    </div>
  );
};

export default CustomFlagsPage;

