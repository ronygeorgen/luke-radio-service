import { axiosInstance } from './api';

export const shiftApi = {
  // Shift Management
  getShifts: async (params = {}) => {
    try {
      const channelId = localStorage.getItem('channelId');
      const requestParams = { ...params };
      if (channelId) {
        requestParams.channel_id = channelId;
      }
      const response = await axiosInstance.get('/shift-analysis/shifts/', { params: requestParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
  },

  deleteShift: async (shiftId) => {
    const response = await axiosInstance.delete(`/shift-analysis/shifts/${shiftId}/`);
    return response.data;
  },

  createShift: async (shiftData) => {
    try {
      const response = await axiosInstance.post('/shift-analysis/shifts/', shiftData);
      return response.data;
    } catch (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
  },

  updateShift: async (id, shiftData) => {
    try {
      const response = await axiosInstance.patch(`/shift-analysis/shifts/${id}/`, shiftData);
      return response.data;
    } catch (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  },

  // Predefined Filters Management
  getPredefinedFilters: async () => {
    try {
      const channelId = localStorage.getItem('channelId');
      const params = {};
      if (channelId) {
        params.channel_id = channelId;
      }
      const response = await axiosInstance.get('/shift-analysis/predefined-filters/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching predefined filters:', error);
      throw error;
    }
  },

  createPredefinedFilter: async (filterData) => {
    try {
      const response = await axiosInstance.post('/shift-analysis/predefined-filters/', filterData);
      return response.data;
    } catch (error) {
      console.error('Error creating predefined filter:', error);
      throw error;
    }
  },

  updatePredefinedFilter: async (id, filterData) => {
    try {
      const response = await axiosInstance.patch(`/shift-analysis/predefined-filters/${id}/`, filterData);
      return response.data;
    } catch (error) {
      console.error('Error updating predefined filter:', error);
      throw error;
    }
  },

  deletePredefinedFilter: async (id) => {
    try {
      const response = await axiosInstance.delete(`/shift-analysis/predefined-filters/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting predefined filter:', error);
      throw error;
    }
  }
};