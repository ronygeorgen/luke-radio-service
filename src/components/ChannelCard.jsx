// ChannelCard.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Trash2, Power, PowerOff, Edit } from 'lucide-react';
import { deleteChannel, toggleChannel } from '../store/slices/channelSlice';

const ChannelCard = ({ channel, onEdit }) => {
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {channel.name ? channel.name : `Channel: ${channel.channelId}`}
          </h3>
          {channel.name && (
            <p className="text-sm text-gray-600 mb-1">
              Channel ID: {channel.channelId}
            </p>
          )}
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Project ID:</span> {channel.projectId}
          </p>
          <p className="text-xs text-gray-500">
            Created: {new Date(channel.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(channel)}
            className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors duration-200"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`p-2 rounded-full transition-colors duration-200 ${
              channel.isActive
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
            className={`p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors duration-200 ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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