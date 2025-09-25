// pages/admin/AssignChannelModal.jsx
import { useState, useEffect } from 'react';
import { X, User, Radio } from 'lucide-react';

const AssignChannelModal = ({ 
  isOpen, 
  onClose, 
  user, 
  channels, 
  onSubmit, 
  loading, 
  error, 
  success 
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Channel to User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-2">
              Select Channel
            </label>
            <select
              id="channel"
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
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

          <div className="flex justify-end space-x-3 pt-4">
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
  );
};

export default AssignChannelModal;