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
    channelType: 'broadcast',
    channelId: '',
    projectId: '',
    name: '',
    timezone: '',
    rssUrl: '',
    rssStartDate: '',
    rssStartTime: '00:00',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState({});

  useEffect(() => {
    if (channelToEdit) {
      setFormData({
        id: channelToEdit.id,
        channelType: channelToEdit.channelType || 'broadcast',
        channelId: channelToEdit.channelId || '',
        projectId: channelToEdit.projectId || '',
        name: channelToEdit.name || '',
        timezone: channelToEdit.timezone || '',
        rssUrl: channelToEdit.rssUrl || '',
        rssStartDate: channelToEdit.rssStartDate ? channelToEdit.rssStartDate.split('T')[0] : '',
        rssStartTime: channelToEdit.rssStartDate ? channelToEdit.rssStartDate.split('T')[1]?.substring(0, 5) || '00:00' : '00:00',
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
        channelType: 'broadcast',
        channelId: '',
        projectId: '',
        name: '',
        timezone: '',
        rssUrl: '',
        rssStartDate: '',
        rssStartTime: '00:00',
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
    
    const name = formData.name ? String(formData.name).trim() : '';
    const timezone = String(formData.timezone || '').trim();
    
    if (!timezone) {
      alert('Please select a timezone');
      return;
    }

    if (formData.channelType === 'broadcast') {
      const channelId = String(formData.channelId || '').trim();
      const projectId = String(formData.projectId || '').trim();
      
      if (!channelId || !projectId) {
        alert('Please fill in Channel ID and Project ID');
        return;
      }
    } else if (formData.channelType === 'podcast') {
      const rssUrl = String(formData.rssUrl || '').trim();
      const rssStartDate = String(formData.rssStartDate || '').trim();
      
      if (!rssUrl) {
        alert('Please fill in RSS URL');
        return;
      }
      
      if (!rssStartDate) {
        alert('Please select a start date');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        channelType: formData.channelType,
        name: name,
        timezone: timezone
      };
      
      if (formData.channelType === 'broadcast') {
        const channelId = String(formData.channelId || '').trim();
        const projectId = String(formData.projectId || '').trim();
        payload.channelId = channelId ? parseInt(channelId, 10) : null;
        payload.projectId = projectId ? parseInt(projectId, 10) : null;
      } else if (formData.channelType === 'podcast') {
        payload.rssUrl = String(formData.rssUrl || '').trim();
        // Format date and time as local datetime without UTC conversion
        const dateStr = String(formData.rssStartDate || '').trim();
        const timeStr = String(formData.rssStartTime || '00:00').trim();
        if (dateStr && timeStr) {
          // Format as YYYY-MM-DDTHH:mm:ss in local time (no timezone conversion)
          payload.rssStartDate = `${dateStr}T${timeStr}:00`;
        }
      }
      
      if (formData.id) {
        payload.id = formData.id;
        await dispatch(updateChannel(payload));
      } else {
        await dispatch(addChannel(payload));
      }
      
      setFormData({
        id: '',
        channelType: 'broadcast',
        channelId: '',
        projectId: '',
        name: '',
        timezone: '',
        rssUrl: '',
        rssStartDate: '',
        rssStartTime: '00:00',
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

  const handleChannelTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      channelType: newType,
      // Clear fields that don't apply to the new type
      ...(newType === 'broadcast' ? { rssUrl: '', rssStartDate: '', rssStartTime: '00:00' } : {}),
      ...(newType === 'podcast' ? { channelId: '', projectId: '' } : {})
    }));
  };

  const handleDateChange = (e) => {
    setFormData(prev => ({
      ...prev,
      rssStartDate: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
          {/* Channel Type Selector */}
          <div>
            <label htmlFor="channelType" className="block text-sm font-medium text-gray-700 mb-1">
              Channel Type *
            </label>
            <select
              id="channelType"
              name="channelType"
              value={formData.channelType}
              onChange={handleChannelTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="broadcast">Broadcast</option>
              <option value="podcast">Podcast</option>
            </select>
          </div>

          {/* Broadcast-specific fields */}
          {formData.channelType === 'broadcast' && (
            <>
              <div>
                <label htmlFor="channelId" className="block text-sm font-medium text-gray-700 mb-1">
                  Channel ID *
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
                  Project ID *
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
            </>
          )}

          {/* Podcast-specific fields */}
          {formData.channelType === 'podcast' && (
            <>
              <div>
                <label htmlFor="rssUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  RSS URL *
                </label>
                <input
                  type="url"
                  id="rssUrl"
                  name="rssUrl"
                  value={formData.rssUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="http://url.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="rssStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Select a start date to fetch the rss data till now. *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      id="rssStartDate"
                      name="rssStartDate"
                      value={formData.rssStartDate}
                      onChange={handleDateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="time"
                      id="rssStartTime"
                      name="rssStartTime"
                      value={formData.rssStartTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Common fields */}
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