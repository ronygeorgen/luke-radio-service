import { axiosInstance } from './api';

export const dashboardApi = {

  getPredefinedFilters: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/shift-analysis/predefined-filters/', {
        params: {
          is_active: true,
          channel: localStorage.getItem("channelId"),
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching predefined filters:', error);
      throw error;
    }
  },
  
  getDashboardStats: async (startDate, endDate, showAllTopics = false, predefinedFilterId = null) => {
    try {
      const channelId = localStorage.getItem("channelId");

      const formatDateTime = (dateStr, isEndDate = false) => {
        const date = new Date(dateStr);
        if (isEndDate) date.setHours(23, 59, 59, 0);
        else date.setHours(0, 0, 0, 0);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startDateTime = formatDateTime(startDate, false);
      const endDateTime = formatDateTime(endDate, true);

      const requestParams = {
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        channel_id: channelId,
        show_all_topics: showAllTopics
      };

      // Add predefined_filter_id if provided
      if (predefinedFilterId) {
        requestParams.predefined_filter_id = predefinedFilterId;
      }

      const response = await axiosInstance.get('/dashboard/stats/', {
        params: requestParams
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getShiftAnalytics: async (startDate, endDate, showAllTopics = false) => {
    try {
      const channelId = localStorage.getItem("channelId");

      const formatDateTime = (dateStr, isEndDate = false) => {
        const date = new Date(dateStr);
        if (isEndDate) date.setHours(23, 59, 59, 0);
        else date.setHours(0, 0, 0, 0);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startDateTime = formatDateTime(startDate, false);
      const endDateTime = formatDateTime(endDate, true);

      const response = await axiosInstance.get('/dashboard/shift-analytics/', {
        params: {
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          channel_id: channelId,
          show_all_topics: showAllTopics
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching shift analytics:', error);
      throw error;
    }
  },

  getAudioSegmentsByTopic: async (topicName, startDate, endDate, showAllTopics = false) => {
    try {
      const channelId = localStorage.getItem("channelId");

      const formatDateTime = (dateStr, isEndDate = false) => {
        const date = new Date(dateStr);
        if (isEndDate) date.setHours(23, 59, 59, 0);
        else date.setHours(0, 0, 0, 0);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startDateTime = formatDateTime(startDate, false);
      const endDateTime = formatDateTime(endDate, true);

      const response = await axiosInstance.get('/dashboard/topic-audio-segments/', {
        params: {
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          topic_name: topicName,
          channel_id: channelId,
          show_all_topics: showAllTopics
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audio segments by topic:', error);
      throw error;
    }
  },
};


