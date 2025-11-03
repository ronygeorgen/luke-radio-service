import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createShift,
  updateShift,
  deleteShift,
  setShiftForm,
  resetShiftForm
} from '../../store/slices/shiftManagementSlice';
import { fetchShifts } from '../../store/slices/shiftManagementSlice';
import { fetchChannels } from '../../store/slices/channelSlice';
import { formatTimeForDisplay, formatTimeForAPI } from '../../utils/dateUtils';
import ShimmerLoading from './ShimmerLoading';
import CommonHeader from './CommonHeader';

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
    // Fetch shifts and channels when component mounts
    dispatch(fetchShifts({ is_active: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchChannels());
    // Get channelId from localStorage and set it in the form
    const channelId = localStorage.getItem('channelId');
    if (channelId) {
      dispatch(setShiftForm({ channel: channelId }));
    }
    // Set flag_seconds to empty by default
    dispatch(setShiftForm({ flag_seconds: '' }));
    // Ensure default should_transcribe is false
    dispatch(setShiftForm({ should_transcribe: false }));
  }, [dispatch]);

  const handleCreateShift = (e) => {
    e.preventDefault();
    const shiftData = {
      ...shiftForm,
      start_time: formatTimeForAPI(shiftForm.start_time),
      end_time: formatTimeForAPI(shiftForm.end_time),
      days: shiftForm.days.join(','),
      flag_seconds: shiftForm.flag_seconds ? parseInt(shiftForm.flag_seconds) : null,
      channel: parseInt(shiftForm.channel),
      // ensure boolean for API
      should_transcribe: !!shiftForm.should_transcribe
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
      flag_seconds: shift.flag_seconds || '',
      should_transcribe: typeof shift.should_transcribe === 'boolean' ? shift.should_transcribe : false
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
    // Reset should_transcribe to default false
    dispatch(setShiftForm({ should_transcribe: false }));
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
    // Default should_transcribe to false
    dispatch(setShiftForm({ should_transcribe: false }));
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-20">
      <CommonHeader 
        title="Shift Management"
        subtitle="Create and manage shift schedules"
      />
      {/* Create New Shift Button */}
      <div className="flex justify-end items-center mt-2 mb-4">
        <button
          onClick={handleCreateNewShift}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-medium transition-colors duration-200"
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

            <div className="flex items-center space-x-8">
              <label className="flex items-center cursor-pointer">
                <input
                  id="shift-active"
                  type="checkbox"
                  checked={!!shiftForm.is_active}
                  onChange={(e) => dispatch(setShiftForm({ is_active: e.target.checked }))}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-400 rounded"
                />
                <span className="ml-2 text-sm text-gray-800 font-medium">Active</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  id="shift-should-transcribe"
                  type="checkbox"
                  checked={!!shiftForm.should_transcribe}
                  onChange={(e) => dispatch(setShiftForm({ should_transcribe: e.target.checked }))}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-400 rounded"
                />
                <span className="ml-2 text-sm text-gray-800 font-medium">Do you want to transcribe</span>
              </label>
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
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead className="sw-thead">
              <tr>
                <th className="sw-th">Shift Name</th>
                <th className="sw-th">Time Range</th>
                <th className="sw-th">Days</th>
                <th className="sw-th">Flag Seconds</th>
                <th className="sw-th">Channel</th>
                <th className="sw-th">Description</th>
                <th className="sw-th">Status</th>
                <th className="sw-th">Actions</th>
              </tr>
            </thead>
            <tbody className="sw-tbody">
              {shifts.map((shift) => {
                const channelName = channels.find(c => c.id === shift.channel?.toString())?.name || 
                                  `Channel ${shift.channel}` || 'N/A';
                const daysList = shift.days ? shift.days.split(',').map(day => 
                  day.charAt(0).toUpperCase() + day.slice(1)
                ).join(', ') : 'N/A';
                
                return (
                  <tr key={shift.id} className="sw-tr">
                    <td className="sw-td whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{shift.name}</div>
                    </td>
                    <td className="sw-td whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTimeForDisplay(shift.start_time)} - {formatTimeForDisplay(shift.end_time)}
                      </div>
                    </td>
                    <td className="sw-td">
                      <div className="text-sm text-gray-900">{daysList}</div>
                    </td>
                    <td className="sw-td whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shift.flag_seconds || 'N/A'}</div>
                    </td>
                    <td className="sw-td whitespace-nowrap">
                      <div className="text-sm text-gray-900">{channelName}</div>
                    </td>
                    <td className="sw-td">
                      <div className="text-sm text-gray-900">{shift.description}</div>
                    </td>
                    <td className="sw-td whitespace-nowrap">
                      <span className={shift.is_active ? 'sw-badge-success' : 'sw-badge-danger'}>
                        {shift.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="sw-td whitespace-nowrap">
                      <div className="sw-actions">
                        <button
                          onClick={() => handleEditShift(shift)}
                          className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          disabled={isShiftDeleting(shift.id)}
                          className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs font-medium"
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
                      </div>
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
      </div>
    </>
  );
};

export default ShiftManagement;