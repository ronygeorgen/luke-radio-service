// ChannelCard.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Trash2, Power, PowerOff, Edit } from 'lucide-react';
import { deleteChannel, toggleChannel } from '../store/slices/channelSlice';

const ChannelCard = ({ channel, onEdit }) => {
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const formatCreatedDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      setIsDeleting(true);
      await dispatch(deleteChannel(channel.id));
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    await dispatch(toggleChannel(channel.id));
    setIsToggling(false);
  };

  return (
    <div className="sw-card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {channel.name ? channel.name : (channel.channelType === 'podcast' ? 'Podcast Channel' : `Channel: ${channel.channelId}`)}
          </h3>
          {channel.channelType === 'podcast' ? (
            <>
              {channel.rssUrl && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">RSS URL:</span> {channel.rssUrl}
                </p>
              )}
              {channel.rssStartDate && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">RSS Start Date:</span> {new Date(channel.rssStartDate).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <>
              {channel.name && channel.channelId && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Channel ID:</span> {channel.channelId}
                </p>
              )}
              {channel.projectId && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Project ID:</span> {channel.projectId}
                </p>
              )}
            </>
          )}
          {channel.timezone && (
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Timezone:</span> {channel.timezone}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Created: { formatCreatedDate(channel.createdAt) }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(channel)}
            className="sw-icon-btn text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`sw-icon-btn ${
              channel.isActive
                ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {channel.isActive ? (
              <Power className="h-4 w-4" />
            ) : (
              <PowerOff className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`sw-icon-btn text-red-600 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              channel.isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          ></div>
          <span className={`text-sm font-medium ${
            channel.isActive ? 'text-green-600' : 'text-gray-500'
          }`}>
            {channel.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChannelCard;