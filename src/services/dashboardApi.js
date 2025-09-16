import { axiosInstance } from './api';

export const dashboardApi = {
  getDashboardStats: async (startDate, endDate, showAllTopics = false) => {
    try {
      const response = await axiosInstance.get('/dashboard/stats/', {
        params: {
          start_date: startDate,
          end_date: endDate,
          channel_id: 1,
          show_all_topics: showAllTopics
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getShiftAnalytics: async (startDate, endDate, showAllTopics = false) => {
    try {
      const response = await axiosInstance.get('/dashboard/shift-analytics/', {
        params: {
          start_date: startDate,
          end_date: endDate,
          channel_id: 1,
          show_all_topics: showAllTopics
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching shift analytics:', error);
      throw error;
    }
  }
};