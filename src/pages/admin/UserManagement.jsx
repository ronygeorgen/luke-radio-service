// pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, RefreshCw, Mail, User, Shield, Key, CheckCircle, XCircle, Plus, Edit, Send, Radio, Search, Trash2 } from 'lucide-react';
import { fetchUsers, assignChannelToUser, deleteUser, clearAssignError, resetAssignState, clearDeleteState } from '../../store/slices/userManagementSlice';
import { fetchChannels } from '../../store/slices/channelSlice';
import { resendMagicLinkAdmin } from '../../store/slices/authSlice';
import AssignChannelModal from './AssignChannelModal';
import CreateUserModal from './CreateUserModal';
import UpdateUserModal from './UpdateUserModal';
import Toast from '../../components/UserSide/Toast';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error, assignLoading, assignError, assignSuccess, deleteLoading, deleteError, deleteSuccess } = useSelector(state => state.userManagement);
  const { channels } = useSelector(state => state.channels);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [resendSuccess, setResendSuccess] = useState({});
  const [resendLoading, setResendLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchChannels());
  }, [dispatch]);

  useEffect(() => {
    if (assignSuccess) {
      // Close modal after successful assignment
      setTimeout(() => {
        setIsAssignModalOpen(false);
        dispatch(resetAssignState());
      }, 2000);
    }
  }, [assignSuccess, dispatch]);

  useEffect(() => {
    if (deleteSuccess) {
      setToastMessage(deleteSuccess);
      setToastType('success');
      dispatch(clearDeleteState());
      // Refresh users list
      dispatch(fetchUsers());
    }
    if (deleteError) {
      setToastMessage(deleteError);
      setToastType('error');
      dispatch(clearDeleteState());
    }
  }, [deleteSuccess, deleteError, dispatch]);

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  const handleRefresh = () => {
    dispatch(fetchUsers());
    dispatch(fetchChannels());
  };

  const handleAssignChannel = (user) => {
    setSelectedUser(user);
    setIsAssignModalOpen(true);
    dispatch(clearAssignError());
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
    dispatch(resetAssignState());
  };

  const handleAssignSubmit = (channelId) => {
    if (selectedUser) {
      dispatch(assignChannelToUser({
        user_id: selectedUser.id,
        channel_id: channelId
      }));
    }
  };

  const handleUpdateUser = (user) => {
    setUserToUpdate(user);
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setUserToUpdate(null);
  };

  const handleResendMagicLink = async (e, user) => {
    e.preventDefault();
    e.stopPropagation();
    
    setResendLoading(prev => ({ ...prev, [user.id]: true }));
    setResendSuccess(prev => {
      const newState = { ...prev };
      delete newState[user.id];
      return newState;
    });
    setToastMessage(null);
    
    const result = await dispatch(resendMagicLinkAdmin(user.email));
    
    setResendLoading(prev => {
      const newState = { ...prev };
      delete newState[user.id];
      return newState;
    });
    
    if (resendMagicLinkAdmin.fulfilled.match(result)) {
      setResendSuccess(prev => ({ ...prev, [user.id]: true }));
      setToastMessage('Magic link has been sent successfully.');
      setToastType('success');
      setTimeout(() => {
        setResendSuccess(prev => {
          const newState = { ...prev };
          delete newState[user.id];
          return newState;
        });
      }, 3000);
    } else if (resendMagicLinkAdmin.rejected.match(result)) {
      const errorData = result.payload;
      let errorMsg = 'Failed to send magic link. Please try again.';
      
      if (errorData?.error) {
        errorMsg = errorData.error;
        if (errorData.seconds_remaining) {
          errorMsg = `${errorData.error} (${errorData.seconds_remaining} seconds remaining)`;
        }
      } else if (errorData?.detail) {
        errorMsg = errorData.detail;
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
      
      setToastMessage(errorMsg);
      setToastType('error');
    }
  };

  const handleDeleteUser = async (e, user) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      await dispatch(deleteUser(user.id));
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const emailMatch = user.email?.toLowerCase().includes(query);
    const nameMatch = user.name?.toLowerCase().includes(query);
    return emailMatch || nameMatch;
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="sw-btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {assignError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{assignError.message || assignError}</p>
        </div>
      )}

      {assignSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">Channel assigned successfully!</p>
        </div>
      )}

      {users.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Users will appear here once they are created.</p>
          </div>
        </div>
      ) : filteredUsers.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">No users match your search criteria.</p>
          </div>
        </div>
      ) : (
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead className="sw-thead">
              <tr>
                <th className="sw-th">User</th>
                <th className="sw-th">Status</th>
                <th className="sw-th">Setup Status</th>
                <th className="sw-th">Role</th>
                <th className="sw-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="sw-tbody">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="sw-tr">
                  <td className="sw-td whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="sw-td whitespace-nowrap">
                    <div className="flex items-center">
                      {user.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="sw-td whitespace-nowrap">
                    <div className="flex items-center">
                      {user.password_set ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${user.password_set ? 'text-green-600' : 'text-red-600'}`}>
                        {user.password_set ? 'Completed Setup' : 'Pending Setup'}
                      </span>
                    </div>
                  </td>
                  <td className="sw-td whitespace-nowrap">
                    <div className="flex items-center">
                      {user.is_admin ? (
                        <Shield className="h-4 w-4 text-purple-500 mr-1" />
                      ) : (
                        <User className="h-4 w-4 text-gray-500 mr-1" />
                      )}
                      <span className="text-sm text-gray-900">
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </td>
                  <td className="sw-td whitespace-nowrap text-sm font-medium text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleUpdateUser(user)}
                        className="px-2 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center justify-center"
                        title="Update User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!user.is_admin && (
                        <button
                          onClick={() => handleAssignChannel(user)}
                          className="px-2 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center"
                          title="Assign Channel"
                        >
                          <Radio className="h-4 w-4" />
                        </button>
                      )}
                      {!user.is_admin && (
                        <button
                          type="button"
                          onClick={(e) => handleResendMagicLink(e, user)}
                          disabled={resendLoading[user.id] || resendSuccess[user.id]}
                          className="px-2 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center"
                          title={resendLoading[user.id] ? "Sending..." : resendSuccess[user.id] ? "Magic link sent!" : "Resend Magic Link"}
                        >
                          {resendLoading[user.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : resendSuccess[user.id] ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteUser(e, user)}
                        disabled={deleteLoading}
                        className="px-2 py-2 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center"
                        title="Delete User"
                      >
                        {deleteLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
      />

      <UpdateUserModal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        user={userToUpdate}
      />

      <AssignChannelModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        user={selectedUser}
        channels={channels}
        onSubmit={handleAssignSubmit}
        loading={assignLoading}
        error={assignError}
        success={assignSuccess}
      />

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

export default UserManagement;