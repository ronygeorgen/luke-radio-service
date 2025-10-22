import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createPredefinedFilter,
  updatePredefinedFilter,
  deletePredefinedFilter,
  setFilterForm,
  resetFilterForm,
  addSchedule,
  updateSchedule,
  removeSchedule
} from '../../store/slices/shiftManagementSlice';
import { formatTimeForDisplay, formatTimeForAPI } from '../../utils/dateUtils';
import ShimmerLoading from './ShimmerLoading';

const PredefinedFilters = () => {
  const dispatch = useDispatch();
  const { predefinedFilters, filterForm, loading } = useSelector((state) => state.shiftManagement);
  const channelId = useSelector((state) => state.channels.currentChannel?.id) || 
                   localStorage.getItem("channelId");
  const [editingFilter, setEditingFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Show shimmer loading only for content
  if (loading && predefinedFilters.length === 0) {
    return (
      <>
        {/* Shimmer for filters table */}
        <div className="mt-6">
          <ShimmerLoading type="table" rows={5} />
        </div>
      </>
    );
  }

  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const handleCreateFilter = (e) => {
    e.preventDefault();

    const schedulesData = filterForm.schedules.map(schedule => {
      const baseSchedule = {
        day_of_week: schedule.day_of_week,
        start_time: formatTimeForAPI(schedule.start_time),
        end_time: formatTimeForAPI(schedule.end_time),
        notes: schedule.notes || ''
      };
      
      if (schedule.id) {
        baseSchedule.id = schedule.id;
      }
      
      return baseSchedule;
    });

    const filterData = {
      ...filterForm,
      channel: parseInt(channelId),
      timezone: timeZone,
      schedules: schedulesData
    };

    if (editingFilter) {
      dispatch(updatePredefinedFilter({ id: editingFilter.id, filterData })).then(() => {
        setEditingFilter(null);
        setShowForm(false);
        dispatch(resetFilterForm());
      });
    } else {
      dispatch(createPredefinedFilter(filterData)).then(() => {
        setShowForm(false);
        dispatch(resetFilterForm());
      });
    }
  };

  const handleEditFilter = (filter) => {
    setEditingFilter(filter);
    setShowForm(true);
    const schedulesWithFormattedTime = filter.schedules.map(schedule => ({
      ...schedule,
      start_time: schedule.start_time,
      end_time: schedule.end_time
    }));
    
    dispatch(setFilterForm({
      name: filter.name,
      description: filter.description,
      channel: filter.channel,
      is_active: filter.is_active,
      schedules: schedulesWithFormattedTime
    }));
  };

  const handleDeleteFilter = (filterId) => {
    if (window.confirm('Are you sure you want to delete this filter?')) {
      dispatch(deletePredefinedFilter(filterId));
    }
  };

  const handleCancelEditFilter = () => {
    setEditingFilter(null);
    setShowForm(false);
    dispatch(resetFilterForm());
  };

  const handleAddSchedule = () => {
    // Get the last schedule's day or start from monday if no schedules
    const lastSchedule = filterForm.schedules[filterForm.schedules.length - 1];
    let nextDay = 'monday'; // Default to monday if no schedules
    
    if (lastSchedule && lastSchedule.day_of_week) {
      const currentDayIndex = dayOptions.findIndex(day => day.value === lastSchedule.day_of_week);
      if (currentDayIndex !== -1 && currentDayIndex < dayOptions.length - 1) {
        nextDay = dayOptions[currentDayIndex + 1].value;
      }
      // If it's already sunday, it will stay as sunday
    }
    
    // Create new schedule with the next day and default times
    const newSchedule = {
      day_of_week: nextDay,
      start_time: '09:00',
      end_time: '17:00',
      notes: ''
    };
    
    // Pass the schedule data to the reducer
    dispatch(addSchedule(newSchedule));
  };

  const handleUpdateSchedule = (index, field, value) => {
    dispatch(updateSchedule({ index, field, value }));
  };

  const handleRemoveSchedule = (index) => {
    dispatch(removeSchedule(index));
  };

  const handleCreateNewFilter = () => {
    setShowForm(true);
    setEditingFilter(null);
    dispatch(resetFilterForm());
  };

  return (
    <>
      {/* Create New Filter Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Predefined Filters</h1>
        <button
          onClick={handleCreateNewFilter}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
        >
          Create New Predefined Filter
        </button>
      </div>

      {/* Filter Form - Only show when creating/editing */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingFilter ? 'Edit Predefined Filter' : 'Create New Predefined Filter'}
          </h2>
          <form onSubmit={handleCreateFilter} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={filterForm.name}
                  onChange={(e) => dispatch(setFilterForm({ name: e.target.value }))}
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
                  value={filterForm.description}
                  onChange={(e) => dispatch(setFilterForm({ description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={filterForm.is_active}
                    onChange={(e) => dispatch(setFilterForm({ is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Active</label>
                </div>
              </div>
            </div>

            {/* Schedules Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Schedules</h3>
                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
                >
                  Add Time Slot
                </button>
              </div>

              {filterForm.schedules.map((schedule, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Day of Week
                      </label>
                      <select
                        value={schedule.day_of_week}
                        onChange={(e) => handleUpdateSchedule(index, 'day_of_week', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {dayOptions.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => handleUpdateSchedule(index, 'start_time', e.target.value)}
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
                        value={schedule.end_time}
                        onChange={(e) => handleUpdateSchedule(index, 'end_time', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={schedule.notes}
                        onChange={(e) => handleUpdateSchedule(index, 'notes', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(index)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {filterForm.schedules.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No time slots added. Click "Add Time Slot" to get started.</p>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={filterForm.schedules.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              >
                {editingFilter ? 'Update Filter' : 'Create Filter'}
              </button>
              <button
                type="button"
                onClick={handleCancelEditFilter}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Predefined Filters Table - Always show when form is not visible */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filter Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Slots
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
              {predefinedFilters.map((filter) => (
                <tr key={filter.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{filter.name}</div>
                    <div className="text-sm text-gray-500">{filter.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{filter.channel_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {filter.schedule_count} time slot(s)
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-h-20 overflow-y-auto">
                      {filter.schedules.map(schedule => (
                        <div key={schedule.id} className="mb-1">
                          {schedule.day_of_week_display}: { schedule.start_time } - { schedule.end_time }
                          {schedule.notes && ` (${schedule.notes})`}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        filter.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {filter.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditFilter(filter)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(filter.id)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {predefinedFilters.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No predefined filters found.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PredefinedFilters;