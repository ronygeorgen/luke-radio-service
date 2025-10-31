// pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, RefreshCw, Mail, User, Shield, Key, CheckCircle, XCircle, Plus } from 'lucide-react';
import { fetchUsers, assignChannelToUser, clearAssignError, resetAssignState } from '../../store/slices/userManagementSlice';
import { fetchChannels } from '../../store/slices/channelSlice';
import AssignChannelModal from './AssignChannelModal';
import CreateUserModal from './CreateUserModal';

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error, assignLoading, assignError, assignSuccess } = useSelector(state => state.userManagement);
  const { channels } = useSelector(state => state.channels);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

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

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-full flex justify-end">
          <button
          onClick={() => setIsUserModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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
      ) : (
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead className="sw-thead">
              <tr>
                <th className="sw-th">User</th>
                <th className="sw-th">Status</th>
                <th className="sw-th">Role</th>
                <th className="sw-th">Actions</th>
              </tr>
            </thead>
            <tbody className="sw-tbody">
              {users.map((user) => (
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
                      {user.password_set ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${user.password_set ? 'text-green-600' : 'text-red-600'}`}>
                        {user.password_set ? 'Active' : 'Pending Setup'}
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
                  <td className="sw-td whitespace-nowrap text-sm font-medium">
                    {!user.is_admin && (
                      <button
                        onClick={() => handleAssignChannel(user)}
                        className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                      >
                        Assign Channel
                      </button>
                    )}
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
    </div>
  );
};

export default UserManagement;