import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createShift,
  updateShift,
  deleteShift,
  setShiftForm,
  resetShiftForm
} from '../../store/slices/shiftManagementSlice';
import { formatTimeForDisplay, formatTimeForAPI } from '../../utils/dateUtils';
import ShimmerLoading from './ShimmerLoading';

const ShiftManagement = () => {
  const dispatch = useDispatch();
  const { shifts, shiftForm, loading } = useSelector((state) => state.shiftManagement);
  const [editingShift, setEditingShift] = useState(null);
  const [deletingShiftId, setDeletingShiftId] = useState(null);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleCreateShift = (e) => {
    e.preventDefault();
    const shiftData = {
      ...shiftForm,
      start_time: formatTimeForAPI(shiftForm.start_time),
      end_time: formatTimeForAPI(shiftForm.end_time),
      timezone: timeZone
    };
    
    if (editingShift) {
      dispatch(updateShift({ id: editingShift.id, shiftData })).then(() => {
        setEditingShift(null);
        dispatch(resetShiftForm());
      });
    } else {
      dispatch(createShift(shiftData));
    }
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    dispatch(setShiftForm({
      ...shift,
      start_time: formatTimeForDisplay(shift.start_time),
      end_time: formatTimeForDisplay(shift.end_time)
    }));
  };

  const handleCancelEditShift = () => {
    setEditingShift(null);
    dispatch(resetShiftForm());
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

  const isShiftDeleting = (shiftId) => {
    return deletingShiftId === shiftId;
  };

  // Show shimmer loading only for content, not header
  if (loading && shifts.length === 0) {
    return (
      <>
        {/* Shimmer for shift form */}
        <ShimmerLoading type="form" />
        
        {/* Shimmer for shifts table */}
        <div className="mt-6">
          <ShimmerLoading type="table" rows={5} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Shift Form */}
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
            {editingShift && (
              <button
                type="button"
                onClick={handleCancelEditShift}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Shifts Table */}
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
            {shifts.map((shift) => (
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
            ))}
          </tbody>
        </table>
        
        {shifts.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No shifts found.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ShiftManagement;