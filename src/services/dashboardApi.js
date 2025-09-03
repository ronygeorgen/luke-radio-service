import { axiosInstance } from './api';

export const dashboardApi = {
  getDashboardStats: async (startDate, endDate) => {
    try {
      const response = await axiosInstance.get('/dashboard/stats/', {
        params: {
          start_date: startDate,
          end_date: endDate,
          channel_id: 1
        }
      });
      return response.data; // This should return the full response including dashboardStats
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
};