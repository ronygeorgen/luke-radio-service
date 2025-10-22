import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createShift,
  updateShift,
  deleteShift,
  setShiftForm,
  resetShiftForm
} from '../../store/slices/shiftManagementSlice';
import { fetchChannels } from '../../store/slices/channelSlice';
import { formatTimeForDisplay, formatTimeForAPI } from '../../utils/dateUtils';
import ShimmerLoading from './ShimmerLoading';

const ShiftManagement = () => {
  const dispatch = useDispatch();
  const { shifts, shiftForm, loading } = useSelector((state) => state.shiftManagement);
  const { channels } = useSelector((state) => state.channels);
  const [editingShift, setEditingShift] = useState(null);
  const [deletingShiftId, setDeletingShiftId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    dispatch(fetchChannels());
    // Get channelId from localStorage and set it in the form
    const channelId = localStorage.getItem('channelId');
    if (channelId) {
      dispatch(setShiftForm({ channel: channelId }));
    }
    // Set flag_seconds to empty by default
    dispatch(setShiftForm({ flag_seconds: '' }));
  }, [dispatch]);

  const handleCreateShift = (e) => {
    e.preventDefault();
    const shiftData = {
      ...shiftForm,
      start_time: formatTimeForAPI(shiftForm.start_time),
      end_time: formatTimeForAPI(shiftForm.end_time),
      days: shiftForm.days.join(','),
      flag_seconds: shiftForm.flag_seconds ? parseInt(shiftForm.flag_seconds) : null,
      channel: parseInt(shiftForm.channel)
    };
    
    if (editingShift) {
      dispatch(updateShift({ id: editingShift.id, shiftData })).then(() => {
        setEditingShift(null);
        setShowForm(false);
        dispatch(resetShiftForm());
        // Reset channelId from localStorage after successful update
        const channelId = localStorage.getItem('channelId');
        if (channelId) {
          dispatch(setShiftForm({ channel: channelId }));
        }
      });
    } else {
      dispatch(createShift(shiftData)).then(() => {
        setShowForm(false);
        dispatch(resetShiftForm());
        // Reset channelId from localStorage after successful creation
        const channelId = localStorage.getItem('channelId');
        if (channelId) {
          dispatch(setShiftForm({ channel: channelId }));
        }
      });
    }
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setShowForm(true);
    dispatch(setShiftForm({
      ...shift,
      start_time: formatTimeForDisplay(shift.start_time),
      end_time: formatTimeForDisplay(shift.end_time),
      days: shift.days ? shift.days.split(',') : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      flag_seconds: shift.flag_seconds || ''
    }));
  };

  const handleDayToggle = (day) => {
    const updatedDays = shiftForm.days.includes(day)
      ? shiftForm.days.filter(d => d !== day)
      : [...shiftForm.days, day];
    dispatch(setShiftForm({ days: updatedDays }));
  };

  const handleCancelEditShift = () => {
    setEditingShift(null);
    setShowForm(false);
    dispatch(resetShiftForm());
    // Reset channelId from localStorage after cancel
    const channelId = localStorage.getItem('channelId');
    if (channelId) {
      dispatch(setShiftForm({ channel: channelId }));
    }
    // Set flag_seconds to empty
    dispatch(setShiftForm({ flag_seconds: '' }));
  };

  const handleDeleteShift = (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift? This action cannot be undone.')) {
      setDeletingShiftId(shiftId);
      dispatch(deleteShift(shiftId))
        .unwrap()
        .then(() => {
          setDeletingShiftId(null);
        })
        .catch(() => {
          setDeletingShiftId(null);
        });
    }
  };

  const handleCreateNewShift = () => {
    setShowForm(true);
    setEditingShift(null);
    dispatch(resetShiftForm());
    // Set channelId from localStorage
    const channelId = localStorage.getItem('channelId');
    if (channelId) {
      dispatch(setShiftForm({ channel: channelId }));
    }
    // Set flag_seconds to empty
    dispatch(setShiftForm({ flag_seconds: '' }));
  };

  const isShiftDeleting = (shiftId) => {
    return deletingShiftId === shiftId;
  };

  // Show shimmer loading only for content, not header
  if (loading && shifts.length === 0) {
    return (
      <>
        {/* Shimmer for shifts table */}
        <div className="mt-6">
          <ShimmerLoading type="table" rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Create New Shift Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
        <button
          onClick={handleCreateNewShift}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
        >
          Create New Shift
        </button>
      </div>

      {/* Shift Form - Only show when creating/editing */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingShift ? 'Edit Shift' : 'Create New Shift'}
          </h2>
          <form onSubmit={handleCreateShift} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Name
                </label>
                <input
                  type="text"
                  value={shiftForm.name}
                  onChange={(e) => dispatch(setShiftForm({ name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={shiftForm.description}
                  onChange={(e) => dispatch(setShiftForm({ description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={shiftForm.start_time}
                  onChange={(e) => dispatch(setShiftForm({ start_time: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={shiftForm.end_time}
                  onChange={(e) => dispatch(setShiftForm({ end_time: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flag Seconds
                </label>
                <input
                  type="number"
                  value={shiftForm.flag_seconds}
                  onChange={(e) => dispatch(setShiftForm({ flag_seconds: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  placeholder="Optional"
                />
              </div>
            </div>
            
            {/* Improved Days of Week Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors duration-200 ${
                      shiftForm.days.includes(day.value)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      shiftForm.days.includes(day.value)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-400'
                    }`}>
                      {shiftForm.days.includes(day.value) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{day.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={shiftForm.is_active}
                  onChange={(e) => dispatch(setShiftForm({ is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              >
                {editingShift ? 'Update Shift' : 'Create Shift'}
              </button>
              <button
                type="button"
                onClick={handleCancelEditShift}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shifts Table - Always show when form is not visible */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flag Seconds
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shifts.map((shift) => {
                const channelName = channels.find(c => c.id === shift.channel?.toString())?.name || 
                                  `Channel ${shift.channel}` || 'N/A';
                const daysList = shift.days ? shift.days.split(',').map(day => 
                  day.charAt(0).toUpperCase() + day.slice(1)
                ).join(', ') : 'N/A';
                
                return (
                  <tr key={shift.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{shift.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTimeForDisplay(shift.start_time)} - {formatTimeForDisplay(shift.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{daysList}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shift.flag_seconds || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{channelName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{shift.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          shift.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {shift.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleEditShift(shift)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        disabled={isShiftDeleting(shift.id)}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
                      >
                        {isShiftDeleting(shift.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {shifts.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No shifts found.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ShiftManagement;