// pages/admin/AssignChannelModal.jsx
import { useState, useEffect } from 'react';
import { X, User, Radio, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

const AssignChannelModal = ({ 
  isOpen, 
  onClose, 
  user, 
  channels, 
  assignedChannels = [],
  assignedChannelsLoading = false,
  onSubmit, 
  onUnassign,
  loading, 
  error, 
  success,
  unassignLoading = null
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedChannelId('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedChannelId) {
      onSubmit(selectedChannelId);
    }
  };

  const handleUnassign = (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && onUnassign) {
      onUnassign(channelId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Assign Channel to User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {user && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Channels Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Channels
            </label>
            {assignedChannelsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : assignedChannels.length === 0 ? (
              <div className="bg-gray-50 rounded-md p-4 text-center">
                <p className="text-sm text-gray-500">No channels assigned yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {assignedChannels.map((item) => {
                  const channel = item.channel || item;
                  const channelId = channel.id;
                  const channelName = channel.name || 'Unknown Channel';
                  const assignedAt = item.assigned_at ? dayjs(item.assigned_at).format('MMM D, YYYY') : '';
                  const isUnassigning = Number(unassignLoading) === Number(channelId);

                  return (
                    <li
                      key={channelId}
                      className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 border border-gray-100"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Radio className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{channelName}</p>
                          {assignedAt && (
                            <p className="text-xs text-gray-500">Assigned {assignedAt}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleUnassign(e, channelId)}
                        disabled={isUnassigning}
                        className="flex items-center px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Unassign channel"
                      >
                        {isUnassigning ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Unassign
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Assign New Channel Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t">
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-2">
                Assign New Channel
              </label>
              <select
                id="channel"
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a channel...</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name} (ID: {channel.channelId})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">
                  {error.message || 'Failed to assign channel. Please try again.'}
                </p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">Channel assigned successfully!</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedChannelId}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-md transition-colors"
              >
                <Radio className="h-4 w-4" />
                <span>{loading ? 'Assigning...' : 'Assign Channel'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignChannelModal;