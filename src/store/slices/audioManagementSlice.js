import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { audioManagementApi } from '../../services/audioManagementApi';

// Async thunks for categories
export const fetchCategories = createAsyncThunk(
  'audioManagement/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await audioManagementApi.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'audioManagement/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await audioManagementApi.createCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'audioManagement/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await audioManagementApi.updateCategory(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
'audioManagement/deleteCategory',
async (id, { rejectWithValue }) => {
    try {
    await audioManagementApi.deleteCategory(id);
    return id;
    } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to delete category');
    }
}
);

// Async thunks for title rules
export const createTitleRule = createAsyncThunk(
  'audioManagement/createTitleRule',
  async (titleData, { rejectWithValue }) => {
    try {
      const response = await audioManagementApi.createTitleRule(titleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create title rule');
    }
  }
);

export const updateTitleRule = createAsyncThunk(
  'audioManagement/updateTitleRule',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await audioManagementApi.updateTitleRule(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update title rule');
    }
  }
);

export const deleteTitleRule = createAsyncThunk(
  'audioManagement/deleteTitleRule',
  async (id, { rejectWithValue }) => {
    try {
      await audioManagementApi.deleteTitleRule(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete title rule');
    }
  }
);

export const fetchCategoryTitles = createAsyncThunk(
  'audioManagement/fetchCategoryTitles',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await audioManagementApi.getCategoryTitles(categoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch category titles');
    }
  }
);

const audioManagementSlice = createSlice({
  name: 'audioManagement',
  initialState: {
    categories: [],
    currentCategoryTitles: null,
    loading: false,
    error: null,
    titleLoading: false,
    titleError: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.titleError = null;
    },
    clearCurrentCategoryTitles: (state) => {
      state.currentCategoryTitles = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload;
       })
       
      // Title Rules
      .addCase(fetchCategoryTitles.pending, (state) => {
        state.titleLoading = true;
        state.titleError = null;
      })
      .addCase(fetchCategoryTitles.fulfilled, (state, action) => {
        state.titleLoading = false;
        state.currentCategoryTitles = action.payload;
      })
      .addCase(fetchCategoryTitles.rejected, (state, action) => {
        state.titleLoading = false;
        state.titleError = action.payload;
      })
      .addCase(createTitleRule.fulfilled, (state, action) => {
        if (state.currentCategoryTitles && state.currentCategoryTitles.category_id === action.payload.category) {
          state.currentCategoryTitles.title_mapping_rules.unshift(action.payload);
          state.currentCategoryTitles.count += 1;
        }
      })
      .addCase(updateTitleRule.fulfilled, (state, action) => {
        if (state.currentCategoryTitles) {
          const index = state.currentCategoryTitles.title_mapping_rules.findIndex(rule => rule.id === action.payload.id);
          if (index !== -1) {
            state.currentCategoryTitles.title_mapping_rules[index] = action.payload;
          }
        }
      })
      .addCase(deleteTitleRule.fulfilled, (state, action) => {
        if (state.currentCategoryTitles) {
          state.currentCategoryTitles.title_mapping_rules = state.currentCategoryTitles.title_mapping_rules.filter(
            rule => rule.id !== action.payload
          );
          state.currentCategoryTitles.count -= 1;
        }
      });
  }
});

export const { clearError, clearCurrentCategoryTitles } = audioManagementSlice.actions;
export default audioManagementSlice.reducer;