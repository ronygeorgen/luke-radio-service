import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

export const fetchTopics = createAsyncThunk(
  'dashboardSettings/fetchTopics',
  async (showAll = false, { rejectWithValue }) => {
    try {
      const channelId = localStorage.getItem('channelId');
      const params = { show_all_topics: showAll };
      if (channelId) {
        params.channel_id = channelId;
      }
      const response = await axiosInstance.get('/general_topics', {
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateTopicStatus = createAsyncThunk(
  'dashboardSettings/updateTopicStatus',
  async ({ topicId, isActive, topicName, originalStatus }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/general_topics', [
        { 
          id: topicId, 
          topic_name: topicName, 
          is_active: isActive 
        }
      ]);
      return { data: response.data, topicId, isActive };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createTopic = createAsyncThunk(
  'dashboardSettings/createTopic',
  async (topicName, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/general_topics', [
        { 
          topic_name: topicName, 
          is_active: false 
        }
      ]);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteTopic = createAsyncThunk(
  'dashboardSettings/deleteTopic',
  async (topicId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete('/general_topics', {
        data: [{ id: topicId }]
      });
      return { topicId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  topics: [],
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  loading: false,
  updating: {}, // Track updating status per topic
  deleting: {}, // Track deleting status per topic
  error: null,
  showAllTopics: false
};

const dashboardSettingsSlice = createSlice({
  name: 'dashboardSettings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setShowAllTopics: (state, action) => {
      state.showAllTopics = action.payload;
    },
    updateTopicLocally: (state, action) => {
      const { topicId, isActive } = action.payload;
      const topicIndex = state.topics.findIndex(topic => topic.id === topicId);
      if (topicIndex !== -1) {
        state.topics[topicIndex].is_active = isActive;
        // Update counts
        if (isActive) {
          state.activeCount += 1;
          state.inactiveCount -= 1;
        } else {
          state.activeCount -= 1;
          state.inactiveCount += 1;
        }
      }
    },
    setTopicUpdating: (state, action) => {
      const { topicId, updating } = action.payload;
      if (updating) {
        state.updating[topicId] = true;
      } else {
        delete state.updating[topicId];
      }
    },
    removeTopicLocally: (state, action) => {
      const topicId = action.payload;
      const topicIndex = state.topics.findIndex(topic => topic.id === topicId);
      if (topicIndex !== -1) {
        const topic = state.topics[topicIndex];
        state.topics.splice(topicIndex, 1);
        state.totalCount -= 1;
        if (topic.is_active) {
          state.activeCount -= 1;
        } else {
          state.inactiveCount -= 1;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch topics
      .addCase(fetchTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || {};
        state.topics = data.topics || [];
        state.totalCount = data.total_count || 0;
        state.activeCount = data.active_count || 0;
        state.inactiveCount = data.inactive_count || 0;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update topic status
      .addCase(updateTopicStatus.pending, (state, action) => {
        const { topicId } = action.meta.arg;
        state.updating[topicId] = true;
        state.error = null;
      })
      .addCase(updateTopicStatus.fulfilled, (state, action) => {
        const { topicId } = action.meta.arg;
        delete state.updating[topicId];
        
        // Update the topic with the new status from API response
        const topicIndex = state.topics.findIndex(topic => topic.id === topicId);
        if (topicIndex !== -1) {
          state.topics[topicIndex].is_active = action.payload.isActive;
        }
      })
      .addCase(updateTopicStatus.rejected, (state, action) => {
        const { topicId, originalStatus } = action.meta.arg;
        delete state.updating[topicId];
        state.error = action.payload;
        
        // Revert local changes if the API call fails
        const topicIndex = state.topics.findIndex(topic => topic.id === topicId);
        if (topicIndex !== -1) {
          state.topics[topicIndex].is_active = originalStatus;
          // Revert counts
          if (originalStatus) {
            state.activeCount += 1;
            state.inactiveCount -= 1;
          } else {
            state.activeCount -= 1;
            state.inactiveCount += 1;
          }
        }
      })
      // Create topic
      .addCase(createTopic.pending, (state) => {
        state.error = null;
      })
      .addCase(createTopic.fulfilled, (state, action) => {
        // Add the new topic to the local state immediately
        const newTopic = action.payload.data?.[0]; // Assuming API returns the created topic
        if (newTopic) {
          state.topics.push(newTopic);
          state.totalCount += 1;
          state.inactiveCount += 1; // Since new topics are blocked by default
        }
      })
      .addCase(createTopic.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete topic
      .addCase(deleteTopic.pending, (state, action) => {
        const topicId = action.meta.arg;
        state.deleting[topicId] = true;
        state.error = null;
      })
      .addCase(deleteTopic.fulfilled, (state, action) => {
        const { topicId } = action.payload;
        delete state.deleting[topicId];
        
        // Remove the topic from local state
        const topicIndex = state.topics.findIndex(topic => topic.id === topicId);
        if (topicIndex !== -1) {
          const topic = state.topics[topicIndex];
          state.topics.splice(topicIndex, 1);
          state.totalCount -= 1;
          if (topic.is_active) {
            state.activeCount -= 1;
          } else {
            state.inactiveCount -= 1;
          }
        }
      })
      .addCase(deleteTopic.rejected, (state, action) => {
        const topicId = action.meta.arg;
        delete state.deleting[topicId];
        state.error = action.payload;
      });
  }
});

export const { clearError, setShowAllTopics, updateTopicLocally, setTopicUpdating, removeTopicLocally } = dashboardSettingsSlice.actions;
export default dashboardSettingsSlice.reducer;