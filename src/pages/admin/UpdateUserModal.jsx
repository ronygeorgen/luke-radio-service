// pages/admin/UpdateUserModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, CheckCircle, XCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, clearError } from '../../store/slices/authSlice';
import { fetchUsers } from '../../store/slices/userManagementSlice';

const UpdateUserModal = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  const dispatch = useDispatch();
  const { updateUserLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        is_active: user.is_active !== undefined ? user.is_active : true
      });
      setErrors({});
      setUpdateSuccess(false);
      dispatch(clearError());
    }
  }, [user, isOpen, dispatch]);

  useEffect(() => {
    if (error) {
      setErrors({ submit: error.detail || error.error || error.message || 'Failed to update user' });
    }
  }, [error]);

  const handleCloseModal = () => {
    setFormData({ name: '', is_active: true });
    setErrors({});
    setUpdateSuccess(false);
    dispatch(clearError());
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const result = await dispatch(updateUser({
      user_id: user.id,
      email: user.email,
      name: formData.name,
      is_active: formData.is_active
    }));
    
    if (updateUser.fulfilled.match(result)) {
      setUpdateSuccess(true);
      // Refresh users list
      dispatch(fetchUsers());
      // Close modal after a short delay to show success
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update User</h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Info Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
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

            {/* Active Status Toggle */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  {formData.is_active ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Inactive users cannot log in to the system
              </p>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Success Message */}
            {updateSuccess && !errors.submit && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800">User updated successfully!</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={updateUserLoading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {updateUserLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Update User</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateUserModal;

