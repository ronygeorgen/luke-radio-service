// ChannelOnboard.jsx (updated navigation)
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Add this import
import { Users, Plus, RefreshCw, UserCog, FileText } from 'lucide-react';
import { fetchChannels } from '../store/slices/channelSlice';
import ChannelCard from './ChannelCard';
import OnboardModal from './OnboardModal';
import CreateUserModal from '../pages/admin/CreateUserModal';
import TranscriptionLogModal from './TranscriptionLogModal';

const ChannelOnboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Add this
  const { channels, loading, error } = useSelector(state => state.channels);
  const { user } = useSelector(state => state.auth);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTranscriptionLogModalOpen, setIsTranscriptionLogModalOpen] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState(null);

  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchChannels());
  };

  const [formData, setFormData] = useState({
    id: '',
    channelId: '',
    projectId: ''
  });

  const handleEditChannel = (channel) => {
    setChannelToEdit(channel);
    setFormData({
      id: channel.id,
      channelId: String(channel.channelId || ''),
      projectId: String(channel.projectId || ''),
      name: channel.name || '',
      timezone: channel.timezone || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setChannelToEdit(null);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  // Navigate to user management using React Router
  const navigateToUserManagement = () => {
    navigate('/admin/users');
  };

  if (loading && channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-full flex justify-end gap-3">
          <button
            onClick={() => setIsTranscriptionLogModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>View Transcription Log</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Channel</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {channels.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No channels found</h3>
            <p className="text-gray-600 mb-4">Get started by onboarding your first channel</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map(channel => (
            <ChannelCard 
              key={channel.id} 
              channel={channel} 
              onEdit={handleEditChannel}
            />
          ))}
        </div>
      )}

      <OnboardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        channelToEdit={channelToEdit}
      />
      
      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
      />

      <TranscriptionLogModal
        isOpen={isTranscriptionLogModalOpen}
        onClose={() => setIsTranscriptionLogModalOpen(false)}
      />
    </div>
  );
};

export default ChannelOnboard;