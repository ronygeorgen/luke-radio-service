import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTopicStatus, createTopic, updateTopicLocally } from '../../store/slices/dashboardSettingsSlice';
import { Ban, CheckCircle } from 'lucide-react';
import ShimmerLoading from './ShimmerLoading';

const TopicManagement = () => {
  const dispatch = useDispatch();
  const { topics, updating, loading } = useSelector((state) => state.dashboardSettings);
  const [newTopic, setNewTopic] = useState('');

  const handleToggleTopic = (topic) => {
    const newStatus = !topic.is_active;
    
    dispatch(updateTopicLocally({
      topicId: topic.id,
      isActive: newStatus
    }));

    dispatch(updateTopicStatus({
      topicId: topic.id,
      topicName: topic.topic_name,
      isActive: newStatus,
      originalStatus: topic.is_active
    }));
  };

  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (newTopic.trim()) {
      dispatch(createTopic(newTopic.trim()));
      setNewTopic('');
    }
  };

  const isTopicUpdating = (topicId) => {
    return updating[topicId] === true;
  };

  // Show shimmer loading only for content
  if (loading && topics.length === 0) {
    return (
      <>
        {/* Shimmer for add topic form */}
        <ShimmerLoading type="form" />
        
        {/* Shimmer for topics table */}
        <div className="mt-6">
          <ShimmerLoading type="table" rows={5} />
        </div>
        
        {/* Shimmer for stats */}
        <div className="mt-6">
          <ShimmerLoading type="stats" />
        </div>
      </>
    );
  }

  return (
    <>
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
            {[...topics]
              .sort((a, b) => {
                // Sort blocked topics first (is_active: false), then active topics (is_active: true)
                if (a.is_active === b.is_active) {
                  // If same status, sort alphabetically by topic name
                  return a.topic_name.localeCompare(b.topic_name);
                }
                return a.is_active ? 1 : -1;
              })
              .map((topic) => (
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
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 flex items-center justify-center space-x-2 w-24 ${
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
    </>
  );
};

export default TopicManagement;