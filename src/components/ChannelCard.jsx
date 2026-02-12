// ChannelCard.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { Trash2, Power, PowerOff, Edit, RefreshCw, X } from 'lucide-react';
import { deleteChannel, toggleChannel, reanalyzeRSS } from '../store/slices/channelSlice';
import Toast from './UserSide/Toast';

const ChannelCard = ({ channel, onEdit }) => {
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const formatCreatedDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await dispatch(deleteChannel(channel.id));
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await dispatch(toggleChannel({
        channelId: channel.id,
        isActive: !channel.isActive
      })).unwrap();
    } catch (err) {
      setToastMessage(err || 'Failed to update channel status');
      setToastType('error');
    } finally {
      setIsToggling(false);
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const result = await dispatch(reanalyzeRSS(parseInt(channel.id, 10)));
      if (reanalyzeRSS.fulfilled.match(result)) {
        const message = result.payload?.message || result.payload?.error || 'RSS feed reanalysis has been queued successfully';
        setToastMessage(message);
        setToastType('success');
      } else {
        const errorMessage = result.payload || result.error?.message || 'Failed to reanalyze RSS feed';
        setToastMessage(errorMessage);
        setToastType('error');
      }
    } catch (error) {
      setToastMessage('Failed to reanalyze RSS feed. Please try again.');
      setToastType('error');
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="sw-card p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
            {channel.name || (channel.channelType === 'podcast' ? 'Podcast Channel' : channel.channelType === 'custom_audio' ? 'Custom Audio' : `Channel: ${channel.channelId}`)}
          </h3>
          {channel.channelType === 'podcast' ? (
            <>
              {channel.rssUrl && (
                <p className="text-xs sm:text-sm text-gray-600 mb-1 break-words">
                  <span className="font-medium">RSS URL:</span> <span className="break-all">{channel.rssUrl}</span>
                </p>
              )}
              {channel.rssStartDate && (
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  <span className="font-medium">RSS Start Date:</span> {new Date(channel.rssStartDate).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <>
              {channel.name && channel.channelId && (
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  <span className="font-medium">Channel ID:</span> {channel.channelId}
                </p>
              )}
              {channel.projectId && (
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  <span className="font-medium">Project ID:</span> {channel.projectId}
                </p>
              )}
            </>
          )}
          {channel.timezone && (
            <p className="text-xs sm:text-sm text-gray-600 mb-1">
              <span className="font-medium">Timezone:</span> {channel.timezone}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Created: { formatCreatedDate(channel.createdAt) }
          </p>
        </div>
        <div className="flex items-center justify-end sm:justify-start flex-wrap gap-2 sm:space-x-2 sm:gap-0 flex-shrink-0">
          {channel.channelType === 'podcast' && (
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className={`sw-icon-btn text-purple-600 ${isReanalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Reanalyze RSS Feed"
            >
              {isReanalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            onClick={() => onEdit(channel)}
            className="sw-icon-btn text-blue-600"
            title="Edit Channel"
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
            title={channel.isActive ? 'Deactivate Channel' : 'Activate Channel'}
          >
            {channel.isActive ? (
              <Power className="h-4 w-4" />
            ) : (
              <PowerOff className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`sw-icon-btn text-red-600 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Delete Channel"
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
      
      {/* Delete confirmation modal (portaled to body) */}
      {showDeleteModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancelDelete}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-channel-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 id="delete-channel-title" className="text-lg font-semibold text-gray-900">
                Delete channel
              </h3>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this channel? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          type={toastType}
        />
      )}
    </div>
  );
};

export default ChannelCard;