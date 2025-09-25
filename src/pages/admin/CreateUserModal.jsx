// pages/admin/CreateUserModal.jsx (updated)
import React, { useState, useEffect } from 'react';
import { X, Mail, User, Send, Radio, CheckCircle, XCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createUser, clearError } from '../../store/slices/authSlice';
import { fetchChannels } from '../../store/slices/channelSlice';
import { assignChannelToUser, resetAssignState } from '../../store/slices/userManagementSlice';

const CreateUserModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [showChannelAssignment, setShowChannelAssignment] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const { channels } = useSelector((state) => state.channels);
  const { assignLoading, assignError, assignSuccess } = useSelector((state) => state.userManagement);

  useEffect(() => {
    if (isOpen) {
      // Fetch channels when modal opens
      dispatch(fetchChannels());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (error) {
      setErrors({ submit: error.detail || error.error || 'Failed to create user' });
    }
  }, [error]);

  useEffect(() => {
    if (assignError) {
      setErrors(prev => ({
        ...prev,
        channel: assignError.message || 'Failed to assign channel'
      }));
    }
  }, [assignError]);

  useEffect(() => {
    if (assignSuccess) {
      // Close modal after successful channel assignment
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    }
  }, [assignSuccess]);

  useEffect(() => {
    if (!isOpen) {
      handleCloseModal();
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    // Reset all states
    setFormData({ email: '', name: '' });
    setErrors({});
    setShowChannelAssignment(false);
    setCreatedUser(null);
    setSelectedChannelId('');
    dispatch(clearError());
    dispatch(resetAssignState());
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (errors.submit || errors.channel) {
      setErrors(prev => ({
        ...prev,
        submit: '',
        channel: ''
      }));
      dispatch(clearError());
    }
  };

  const handleChannelChange = (e) => {
    setSelectedChannelId(e.target.value);
    if (errors.channel) {
      setErrors(prev => ({
        ...prev,
        channel: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    return newErrors;
  };

  const validateChannelAssignment = () => {
    if (!selectedChannelId) {
      return { channel: 'Please select a channel' };
    }
    return {};
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const result = await dispatch(createUser(formData));
    
    if (createUser.fulfilled.match(result)) {
      // Extract user data from the response - it's nested under result.payload.user
      const userData = result.payload.user;
      setCreatedUser(userData);
      
      if (result.payload.error && result.payload.error.includes('failed to send magic link')) {
        // User created but email failed - show warning and proceed to channel assignment
        setErrors({ 
          submit: 'User created but email failed to send. You may need to resend the magic link.' 
        });
        setShowChannelAssignment(true);
      } else {
        // Complete success - proceed to channel assignment
        setShowChannelAssignment(true);
      }
    }
  };

  const handleAssignChannel = async (e) => {
    e.preventDefault();
    const channelErrors = validateChannelAssignment();
    
    if (Object.keys(channelErrors).length > 0) {
      setErrors(channelErrors);
      return;
    }
    
    if (createdUser && selectedChannelId) {
      await dispatch(assignChannelToUser({
        user_id: createdUser.id, // Use the created user's ID
        channel_id: selectedChannelId
      }));
    }
  };

  const handleSkipChannelAssignment = () => {
    handleCloseModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {showChannelAssignment ? 'Assign Channel' : 'Create New User'}
          </h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showChannelAssignment ? (
            /* Create User Form */
            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className={`p-3 rounded-lg text-sm ${
                  errors.submit.includes('failed to send') 
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {errors.submit}
                </div>
              )}

              {/* Info Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  A magic link will be sent to the user's email to set their password.
                </p>
              </div>
            </form>
          ) : (
            /* Channel Assignment Form */
            <form onSubmit={handleAssignChannel} className="space-y-4">
              {/* User Info */}
              {createdUser && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{createdUser.name}</p>
                      <p className="text-sm text-gray-600">{createdUser.email}</p>
                      <p className="text-xs text-gray-500 mt-1">User ID: {createdUser.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Channel Selection */}
              <div>
                <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Channel to Assign
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Radio className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="channel"
                    value={selectedChannelId}
                    onChange={handleChannelChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.channel ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Choose a channel...</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name} (ID: {channel.id})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.channel && <p className="mt-1 text-sm text-red-600">{errors.channel}</p>}
              </div>

              {/* Assignment Status */}
              {assignSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">Channel assigned successfully!</p>
                  </div>
                </div>
              )}

              {assignError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      {assignError.message || 'Failed to assign channel'}
                    </p>
                  </div>
                </div>
              )}

              {/* Info Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Assign a channel to this user to grant them access to specific content.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          {!showChannelAssignment ? (
            /* Create User Footer */
            <>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreateUser}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Create User</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Channel Assignment Footer */
            <>
              <button
                type="button"
                onClick={handleSkipChannelAssignment}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                onClick={handleAssignChannel}
                disabled={assignLoading || assignSuccess || !selectedChannelId}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {assignLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : assignSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Assigned!</span>
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4" />
                    <span>Assign Channel</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;