// store/slices/reportSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Async thunks
export const fetchReportFolders = createAsyncThunk(
  'reports/fetchFolders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/report_folders');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report folders');
    }
  }
);

export const createReportFolder = createAsyncThunk(
  'reports/createFolder',
  async (folderData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/report_folders', folderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create report folder');
    }
  }
);

export const updateReportFolder = createAsyncThunk(
  'reports/updateFolder',
  async ({ id, ...folderData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/report_folders/${id}`, folderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update report folder');
    }
  }
);

export const deleteReportFolder = createAsyncThunk(
  'reports/deleteFolder',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/report_folders/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete report folder');
    }
  }
);

export const addSegmentToReport = createAsyncThunk(
  'reports/addSegment',
  async ({ folder_id, audio_segment_id }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/save/audio_segment', {
        folder_id,
        audio_segment_id
      });
      return response.data;
    } catch (error) {
      const apiError = error.response?.data?.error || error.response?.data?.message;
      return rejectWithValue(apiError || 'Failed to add segment to report');
    }
  }
);

export const deleteSegmentFromReport = createAsyncThunk(
  'reports/deleteSegment',
  async (savedSegmentId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/saved/segments/${savedSegmentId}`);
      return savedSegmentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete segment from report');
    }
  }
);

export const fetchReportSegments = createAsyncThunk(
  'reports/fetchSegments',
  async (folderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/folders/${folderId}/contents`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report segments');
    }
  }
);

export const fetchInsights = createAsyncThunk(
  'reports/fetchInsights',
  async (savedSegmentId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/saved/segments/${savedSegmentId}/insights`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch insights');
    }
  }
);

export const createInsight = createAsyncThunk(
  'reports/createInsight',
  async ({ savedSegmentId, insightData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/saved/segments/${savedSegmentId}/insights`,
        insightData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create insight');
    }
  }
);

export const updateInsight = createAsyncThunk(
  'reports/updateInsight',
  async ({ savedSegmentId, insightId, insightData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/saved/segments/${savedSegmentId}/insights/${insightId}`,
        insightData
      );
      return { savedSegmentId, insight: response.data.data }; // normalize response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update insight');
    }
  }
);


export const deleteInsight = createAsyncThunk(
  'reports/deleteInsight',
  async ({ savedSegmentId, insightId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/saved/segments/${savedSegmentId}/insights/${insightId}`);
      return { savedSegmentId, insightId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete insight');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    folders: [],
    currentReport: null,
    segments: [],
    loading: false,
    error: null,
    folderLoading: false,
    folderError: null,
    insights: [],
    insightsBySegment: {},
    insightsLoading: false,
    insightsError: null,
    insightCreating: false,
    insightUpdating: false
  },
  reducers: {
    clearReportError: (state) => {
      state.error = null;
      state.folderError = null;
    },
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    clearInsightsError: (state) => {
      state.insightsError = null;
    }
  },
  extraReducers: (builder) => {
  builder
    // Fetch folders
    .addCase(fetchReportFolders.pending, (state) => {
      state.folderLoading = true;
      state.folderError = null;
    })
    .addCase(fetchReportFolders.fulfilled, (state, action) => {
      state.folderLoading = false;
      state.folders = action.payload.data.folders;
    })
    .addCase(fetchReportFolders.rejected, (state, action) => {
      state.folderLoading = false;
      state.folderError = action.payload;
    })

    //update report folder
    .addCase(updateReportFolder.fulfilled, (state, action) => {
      state.loading = false;
      const updatedFolder = action.payload.data;

      // update it in the folders list
      const index = state.folders.findIndex(folder => folder.id === updatedFolder.id);
      if (index !== -1) {
        state.folders[index] = updatedFolder;
      }

      // also update currentReport if it’s the same folder
      if (state.currentReport && state.currentReport.id === updatedFolder.id) {
        state.currentReport = updatedFolder;
      }
    })
    
    // Create folder
    .addCase(createReportFolder.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createReportFolder.fulfilled, (state, action) => {
      state.loading = false;
      state.folders.push(action.payload.data);
    })
    .addCase(createReportFolder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Fetch report segments
    .addCase(fetchReportSegments.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchReportSegments.fulfilled, (state, action) => {
      state.loading = false;
      state.segments = action.payload.data.saved_segments;
      state.currentReport = action.payload.data.folder;
    })
    .addCase(fetchReportSegments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Add segment to report
    .addCase(addSegmentToReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(addSegmentToReport.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
    })
    .addCase(addSegmentToReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    
    // Delete segment from report
    .addCase(deleteSegmentFromReport.fulfilled, (state, action) => {
      state.segments = state.segments.filter(segment => 
        segment.saved_segment_id !== action.payload
      );
    })
    
    // Fetch Insights
    .addCase(fetchInsights.pending, (state) => {
      state.insightsLoading = true;
      state.insightsError = null;
    })
    .addCase(fetchInsights.fulfilled, (state, action) => {
      state.insightsLoading = false;
      const { saved_segment_id, insights } = action.payload.data;
      state.insightsBySegment[saved_segment_id] = insights;
    })
    .addCase(fetchInsights.rejected, (state, action) => {
      state.insightsLoading = false;
      state.insightsError = action.payload;
    })
    
    // Create Insight
    .addCase(createInsight.pending, (state) => {
      state.insightCreating = true;
      state.insightsError = null;
    })
    .addCase(createInsight.fulfilled, (state, action) => {
      state.insightCreating = false;
      const insight = action.payload.data;   // the full insight object
      const saved_segment_id = insight.saved_segment_id;

      if (!state.insightsBySegment[saved_segment_id]) {
        state.insightsBySegment[saved_segment_id] = [];
      }

      state.insightsBySegment[saved_segment_id].push(insight);
    })
    .addCase(createInsight.rejected, (state, action) => {
      state.insightCreating = false;
      state.insightsError = action.payload;
    })
    
    // Update Insight
    .addCase(updateInsight.pending, (state) => {
      state.insightUpdating = true;
      state.insightsError = null;
    })
    .addCase(updateInsight.fulfilled, (state, action) => {
      state.insightUpdating = false;
      const { savedSegmentId, insight } = action.payload;

      if (state.insightsBySegment[savedSegmentId]) {
        const index = state.insightsBySegment[savedSegmentId].findIndex(
          (i) => i.id === insight.id
        );
        if (index !== -1) {
          state.insightsBySegment[savedSegmentId][index] = insight;
        }
      }
    })
    .addCase(updateInsight.rejected, (state, action) => {
      state.insightUpdating = false;
      state.insightsError = action.payload;
    })
    
    //Delete report folder
    .addCase(deleteReportFolder.fulfilled, (state, action) => {
      const deletedId = action.payload;
      state.folders = state.folders.filter(folder => folder.id !== deletedId);

      // if the current report is the one deleted, clear it
      if (state.currentReport && state.currentReport.id === deletedId) {
        state.currentReport = null;
        state.segments = [];
      }
    })
    // Delete Insight
    .addCase(deleteInsight.fulfilled, (state, action) => {
      const { savedSegmentId, insightId } = action.payload;
      if (state.insightsBySegment[savedSegmentId]) {
        state.insightsBySegment[savedSegmentId] =
          state.insightsBySegment[savedSegmentId].filter(
            (i) => i.id !== insightId
          );
      }
    })
}
});

export const { clearReportError, setCurrentReport, clearCurrentReport, clearInsightsError } = reportSlice.actions;
export default reportSlice.reducer;