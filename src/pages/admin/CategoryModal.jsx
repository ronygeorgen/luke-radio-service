import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { createCategory, updateCategory, clearError } from '../../store/slices/audioManagementSlice';
import { fetchChannels } from '../../store/slices/channelSlice';

const CategoryModal = ({ isOpen, onClose, category }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.audioManagement);
  const { channels } = useSelector(state => state.channels);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    channel: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch channels when modal opens
      dispatch(fetchChannels());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        is_active: category.is_active,
        channel: category.channel || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        channel: ''
      });
    }
    dispatch(clearError());
  }, [category, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.channel) {
      alert('Please select a channel');
      return;
    }

    if (category) {
      dispatch(updateCategory({ id: category.id, data: formData }))
        .unwrap()
        .then(() => onClose())
        .catch(() => {});
    } else {
      dispatch(createCategory(formData))
        .unwrap()
        .then(() => onClose())
        .catch(() => {});
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {category ? 'Edit Category' : 'Create New Category'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Channel Dropdown */}
          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
              Channel *
            </label>
            <select
              id="channel"
              name="channel"
              required
              value={formData.channel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name} 
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category description"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (category ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;