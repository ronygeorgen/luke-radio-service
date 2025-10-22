import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { shiftApi } from '../../services/shiftApi';
import { formatTimeForAPI } from '../../utils/dateUtils';

// Async thunks for Shifts
export const fetchShifts = createAsyncThunk(
  'shiftManagement/fetchShifts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await shiftApi.getShifts(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteShift = createAsyncThunk(
  'shiftManagement/deleteShift',
  async (shiftId, { rejectWithValue }) => {
    try {
      // Use the proper method from your shiftApi service
      await shiftApi.deleteShift(shiftId);
      return shiftId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createShift = createAsyncThunk(
  'shiftManagement/createShift',
  async (shiftData, { rejectWithValue }) => {
    try {
      const response = await shiftApi.createShift(shiftData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateShift = createAsyncThunk(
  'shiftManagement/updateShift',
  async ({ id, shiftData }, { rejectWithValue }) => {
    try {
      const response = await shiftApi.updateShift(id, shiftData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunks for Predefined Filters
export const fetchPredefinedFilters = createAsyncThunk(
  'shiftManagement/fetchPredefinedFilters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shiftApi.getPredefinedFilters();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createPredefinedFilter = createAsyncThunk(
  'shiftManagement/createPredefinedFilter',
  async (filterData, { rejectWithValue }) => {
    try {
      const response = await shiftApi.createPredefinedFilter(filterData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updatePredefinedFilter = createAsyncThunk(
  'shiftManagement/updatePredefinedFilter',
  async ({ id, filterData }, { rejectWithValue }) => {
    try {
      const response = await shiftApi.updatePredefinedFilter(id, filterData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deletePredefinedFilter = createAsyncThunk(
  'shiftManagement/deletePredefinedFilter',
  async (id, { rejectWithValue }) => {
    try {
      await shiftApi.deletePredefinedFilter(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  shifts: [],
  predefinedFilters: [],
  loading: false,
  error: null,
  currentView: 'topics', // 'topics', 'shifts', 'predefined-filters'
  shiftForm: {
    name: '',
    start_time: '',
    end_time: '',
    description: '',
    is_active: true,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    flag_seconds: 300,
    channel: ''
  },
  filterForm: {
    name: '',
    description: '',
    is_active: true,
    schedules: []
  }
};

const shiftManagementSlice = createSlice({
  name: 'shiftManagement',
  initialState,
  reducers: {
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    setShiftForm: (state, action) => {
      state.shiftForm = { ...state.shiftForm, ...action.payload };
    },
    resetShiftForm: (state) => {
      state.shiftForm = initialState.shiftForm;
    },
    setFilterForm: (state, action) => {
      state.filterForm = { ...state.filterForm, ...action.payload };
    },
    resetFilterForm: (state) => {
      state.filterForm = initialState.filterForm;
    },
    addSchedule: (state, action) => {
      const scheduleData = action.payload || {
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '17:00',
        notes: ''
      };
      state.filterForm.schedules.push(scheduleData);
    },
    updateSchedule: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.filterForm.schedules[index]) {
        state.filterForm.schedules[index][field] = value;
      }
    },
    removeSchedule: (state, action) => {
      state.filterForm.schedules.splice(action.payload, 1);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Shifts
      .addCase(fetchShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.shifts = action.payload;
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createShift.fulfilled, (state, action) => {
        state.shifts.push(action.payload);
        state.shiftForm = initialState.shiftForm;
      })
      .addCase(updateShift.fulfilled, (state, action) => {
        const index = state.shifts.findIndex(shift => shift.id === action.payload.id);
        if (index !== -1) {
          state.shifts[index] = action.payload;
        }
      })
      // Predefined Filters
      .addCase(fetchPredefinedFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPredefinedFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.predefinedFilters = action.payload;
      })
      .addCase(fetchPredefinedFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPredefinedFilter.fulfilled, (state, action) => {
        // Replace the entire predefinedFilters array with a new one that includes the created filter
        state.predefinedFilters = [...state.predefinedFilters, action.payload];
        state.filterForm = initialState.filterForm;
      })
      .addCase(updatePredefinedFilter.fulfilled, (state, action) => {
        const index = state.predefinedFilters.findIndex(filter => filter.id === action.payload.id);
        if (index !== -1) {
            // Replace the entire filter object with the updated one from API
            state.predefinedFilters[index] = action.payload;
        }
        state.filterForm = initialState.filterForm;
      })
      .addCase(deletePredefinedFilter.fulfilled, (state, action) => {
        state.predefinedFilters = state.predefinedFilters.filter(filter => filter.id !== action.payload);
      })
      .addCase(deleteShift.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.loading = false;
        state.shifts = state.shifts.filter(shift => shift.id !== action.payload);
      })
      .addCase(deleteShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setCurrentView,
  setShiftForm,
  resetShiftForm,
  setFilterForm,
  resetFilterForm,
  addSchedule,
  updateSchedule,
  removeSchedule,
  clearError
} = shiftManagementSlice.actions;

export default shiftManagementSlice.reducer;