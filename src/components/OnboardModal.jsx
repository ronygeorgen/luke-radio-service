// OnboardModal.jsx
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { addChannel, updateChannel } from '../store/slices/channelSlice';
import TimezoneSelect from 'react-timezone-select';

const OnboardModal = ({ isOpen, onClose, channelToEdit }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    id: '',
    channelId: '',
    projectId: '',
    name: '',
    timezone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState({});

  useEffect(() => {
    if (channelToEdit) {
      setFormData({
        id: channelToEdit.id,
        channelId: channelToEdit.channelId,
        projectId: channelToEdit.projectId,
        name: channelToEdit.name || '',
        timezone: channelToEdit.timezone || ''
      });
      
      if (channelToEdit.timezone) {
        setSelectedTimezone({
          value: channelToEdit.timezone,
          label: channelToEdit.timezone
        });
      }
    } else {
      setFormData({
        id: '',
        channelId: '',
        projectId: '',
        name: '',
        timezone: ''
      });
      setSelectedTimezone({});
    }
  }, [channelToEdit]);

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
    setFormData(prev => ({
      ...prev,
      timezone: timezone.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const channelId = String(formData.channelId || '').trim();
    const projectId = String(formData.projectId || '').trim();
    const name = formData.name ? String(formData.name).trim() : '';
    const timezone = String(formData.timezone || '').trim();
    
    if (!channelId || !projectId || !timezone) {
      alert('Please fill in Channel ID, Project ID and Timezone');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        channelId: channelId ? parseInt(channelId, 10) : null,
        projectId: projectId ? parseInt(projectId, 10) : null,
        name: name,
        timezone: timezone
      };
      
      if (formData.id) {
        payload.id = formData.id;
        await dispatch(updateChannel(payload));
      } else {
        await dispatch(addChannel(payload));
      }
      
      setFormData({
        id: '',
        channelId: '',
        projectId: '',
        name: '',
        timezone: ''
      });
      setSelectedTimezone({});
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error saving channel:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {formData.id ? 'Edit Channel' : 'Onboard New Channel'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 mb-1">
              Channel ID
            </label>
            <input
              type="text"
              id="channelId"
              name="channelId"
              value={formData.channelId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter channel ID"
              required
            />
          </div>

          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
              Project ID
            </label>
            <input
              type="text"
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project ID"
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter channel name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone *
            </label>
            <TimezoneSelect
              value={selectedTimezone}
              onChange={handleTimezoneChange}
              className="timezone-select"
              classNames={{
                control: (state) => 
                  `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${state.isFocused ? 'border-blue-500' : ''}`
              }}
              placeholder="Select timezone..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? formData.id ? 'Updating...' : 'Adding...' 
                : formData.id ? 'Update Channel' : 'Add Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardModal;