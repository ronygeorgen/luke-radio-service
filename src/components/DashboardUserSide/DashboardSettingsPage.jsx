import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchTopics, 
  updateTopicStatus, 
  createTopic, 
  setShowAllTopics,
  updateTopicLocally 
} from '../../store/slices/dashboardSettingsSlice';
import { Settings, ArrowLeft, Ban, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardSettingsPage = () => {
  const dispatch = useDispatch();
  const { topics, loading, updating, error, showAllTopics } = useSelector((state) => state.dashboardSettings);
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    dispatch(fetchTopics(showAllTopics));
  }, [dispatch, showAllTopics]);

  const handleToggleTopic = (topic) => {
    const newStatus = !topic.is_active;
    
    // Update locally first for immediate UI feedback
    dispatch(updateTopicLocally({
      topicId: topic.id,
      isActive: newStatus
    }));

    // Then make the API call
    dispatch(updateTopicStatus({
      topicId: topic.id,
      topicName: topic.topic_name,
      isActive: newStatus,
      originalStatus: topic.is_active // Store original status for potential rollback
    }));
  };

  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (newTopic.trim()) {
      dispatch(createTopic(newTopic.trim()));
      setNewTopic('');
    }
  };

  const handleShowAllChange = (e) => {
    dispatch(setShowAllTopics(e.target.checked));
  };

  // Check if a specific topic is being updated
  const isTopicUpdating = (topicId) => {
    return updating[topicId] === true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="bg-white bg-opacity-20 p-3 rounded-full">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Topic Settings</h1>
            <p className="text-gray-600">Manage blocked and active topics</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error.message || error.error || JSON.stringify(error)}
        </div>
      )}

      {/* Add New Topic Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Topic to Block</h2>
        <form onSubmit={handleCreateTopic} className="flex space-x-4">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Enter topic name to block"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={!newTopic.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
          >
            Block Topic
          </button>
        </form>
      </div>

      {/* Topics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Topic Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topics.map((topic) => (
              <tr key={topic.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{topic.topic_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      topic.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {topic.is_active ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleTopic(topic)}
                    disabled={isTopicUpdating(topic.id)}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 flex items-center space-x-2 ${
                      topic.is_active
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:bg-gray-400`}
                  >
                    {isTopicUpdating(topic.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : topic.is_active ? (
                      <>
                        <Ban className="w-4 h-4" />
                        <span>Block</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Unblock</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {topics.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No topics found.</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
            <div className="text-sm text-gray-600">Total Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {topics.filter(t => t.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {topics.filter(t => !t.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Blocked Topics</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettingsPage;