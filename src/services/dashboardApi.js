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

        // Use ISO-like format expected by v2 API with 'T' separator
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const startDateTime = formatDateTime(startDate, false);
      const endDateTime = formatDateTime(endDate, true);

      const response = await axiosInstance.get('/dashboard/shift-analytics/v2/', {
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

  getSummary: async (startDate, endDate, channelId, shiftId = null) => {
    try {
      const { convertLocalToUTC } = await import('../utils/dateTimeUtils');
      
      // Convert local dates to UTC datetime strings
      const startDatetime = convertLocalToUTC(startDate, '00:00:00');
      const endDatetime = convertLocalToUTC(endDate, '23:59:59');
      
      // Format as YYYY-MM-DDTHH:mm:ss (remove milliseconds and Z)
      const formatForAPI = (isoString) => {
        if (!isoString) return null;
        // Remove milliseconds and Z, keep the format as YYYY-MM-DDTHH:mm:ss
        return isoString.replace(/\.\d{3}Z$/, '').replace('Z', '');
      };
      
      const params = {
        start_datetime: formatForAPI(startDatetime),
        end_datetime: formatForAPI(endDatetime),
        channel_id: parseInt(channelId, 10)
      };
      
      if (shiftId) {
        params.shift_id = parseInt(shiftId, 10);
      }
      
      const response = await axiosInstance.get('/v2/dashboard/summary/', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  },

  getBucketCount: async (startDate, endDate, channelId, shiftId = null) => {
    try {
      const { convertLocalToUTC } = await import('../utils/dateTimeUtils');
      
      // Convert local dates to UTC datetime strings
      const startDatetime = convertLocalToUTC(startDate, '00:00:00');
      const endDatetime = convertLocalToUTC(endDate, '23:59:59');
      
      // Format as YYYY-MM-DDTHH:mm:ss (remove milliseconds and Z)
      const formatForAPI = (isoString) => {
        if (!isoString) return null;
        // Remove milliseconds and Z, keep the format as YYYY-MM-DDTHH:mm:ss
        return isoString.replace(/\.\d{3}Z$/, '').replace('Z', '');
      };
      
      const params = {
        start_datetime: formatForAPI(startDatetime),
        end_datetime: formatForAPI(endDatetime),
        channel_id: parseInt(channelId, 10)
      };
      
      if (shiftId) {
        params.shift_id = parseInt(shiftId, 10);
      }
      
      const response = await axiosInstance.get('/v2/dashboard/bucket-count/', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bucket count:', error);
      throw error;
    }
  },

  getCategoryBucketCount: async (startDate, endDate, channelId, categoryName, shiftId = null) => {
    try {
      const { convertLocalToUTC } = await import('../utils/dateTimeUtils');
      
      // Convert local dates to UTC datetime strings
      const startDatetime = convertLocalToUTC(startDate, '00:00:00');
      const endDatetime = convertLocalToUTC(endDate, '23:59:59');
      
      // Format as YYYY-MM-DDTHH:mm:ss (remove milliseconds and Z)
      const formatForAPI = (isoString) => {
        if (!isoString) return null;
        // Remove milliseconds and Z, keep the format as YYYY-MM-DDTHH:mm:ss
        return isoString.replace(/\.\d{3}Z$/, '').replace('Z', '');
      };
      
      const params = {
        start_datetime: formatForAPI(startDatetime),
        end_datetime: formatForAPI(endDatetime),
        channel_id: parseInt(channelId, 10),
        category_name: categoryName
      };
      
      if (shiftId) {
        params.shift_id = parseInt(shiftId, 10);
      }
      
      const response = await axiosInstance.get('/v2/dashboard/category-bucket-count/', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching category bucket count:', error);
      throw error;
    }
  },

  getTopTopics: async (startDate, endDate, channelId, sortBy = 'count', shiftId = null, showAllTopics = true) => {
    try {
      const { convertLocalToUTC } = await import('../utils/dateTimeUtils');
      
      // Convert local dates to UTC datetime strings
      const startDatetime = convertLocalToUTC(startDate, '00:00:00');
      const endDatetime = convertLocalToUTC(endDate, '23:59:59');
      
      // Format as YYYY-MM-DDTHH:mm:ss (remove milliseconds and Z)
      const formatForAPI = (isoString) => {
        if (!isoString) return null;
        // Remove milliseconds and Z, keep the format as YYYY-MM-DDTHH:mm:ss
        return isoString.replace(/\.\d{3}Z$/, '').replace('Z', '');
      };
      
      const params = {
        start_datetime: formatForAPI(startDatetime),
        end_datetime: formatForAPI(endDatetime),
        channel_id: parseInt(channelId, 10),
        show_all_topics: showAllTopics,
        sort_by: sortBy
      };
      
      if (shiftId) {
        params.shift_id = parseInt(shiftId, 10);
      }
      
      const response = await axiosInstance.get('/v2/dashboard/topics/', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top topics:', error);
      throw error;
    }
  },

  getGeneralTopicCountByShift: async (startDate, endDate, channelId, showAllTopics = false) => {
    try {
      const { convertLocalToUTC } = await import('../utils/dateTimeUtils');
      
      // Convert local dates to UTC datetime strings
      const startDatetime = convertLocalToUTC(startDate, '00:00:00');
      const endDatetime = convertLocalToUTC(endDate, '23:59:59');
      
      // Format as YYYY-MM-DDTHH:mm:ss (remove milliseconds and Z)
      const formatForAPI = (isoString) => {
        if (!isoString) return null;
        // Remove milliseconds and Z, keep the format as YYYY-MM-DDTHH:mm:ss
        return isoString.replace(/\.\d{3}Z$/, '').replace('Z', '');
      };
      
      const params = {
        start_datetime: formatForAPI(startDatetime),
        end_datetime: formatForAPI(endDatetime),
        channel_id: parseInt(channelId, 10),
        show_all_topics: showAllTopics
      };
      
      const response = await axiosInstance.get('/v2/dashboard/general-topic-count-by-shift/', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching general topic count by shift:', error);
      throw error;
    }
  },

  getWordCount: async (startDate, endDate, channelId, shiftId = null) => {
    try {
      const { convertLocalToUTC } = await import('../utils/dateTimeUtils');
      
      // Convert local dates to UTC datetime strings
      const startDatetime = convertLocalToUTC(startDate, '00:00:00');
      const endDatetime = convertLocalToUTC(endDate, '23:59:59');
      
      // Format as YYYY-MM-DDTHH:mm:ss (remove milliseconds and Z)
      const formatForAPI = (isoString) => {
        if (!isoString) return null;
        // Remove milliseconds and Z, keep the format as YYYY-MM-DDTHH:mm:ss
        return isoString.replace(/\.\d{3}Z$/, '').replace('Z', '');
      };
      
      const params = {
        start_datetime: formatForAPI(startDatetime),
        end_datetime: formatForAPI(endDatetime),
        channel_id: parseInt(channelId, 10)
      };
      
      if (shiftId) {
        params.shift_id = parseInt(shiftId, 10);
      }
      
      const response = await axiosInstance.get('/v2/dashboard/word-count/', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching word count:', error);
      throw error;
    }
  },
};


