// settingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

// Helper function to convert frontend settings keys to backend API keys
const convertSettingsToApiFormat = (frontendSettings) => {
  const keyMapping = {
    openAiTranscriptionApi: 'openai_api_key',
    openAiOrganisationalId: 'openai_org_id',
    googleCloudClientId: 'google_client_id',
    googleCloudClientSecret: 'google_client_secret',
    acrCloudApi: 'acr_cloud_api_key',
    revAiAccessToken: 'revai_access_token',
    revAiAuthorization: 'revai_authorization',
    summariseTranscript: 'summarize_transcript_prompt',
    sentimentAnalysis: 'sentiment_analysis_prompt',
    generalTopicsPrompt: 'general_topics_prompt',
    iabTopicsPrompt: 'iab_topics_prompt',
    bucketPrompt: 'bucket_prompt',
    determineRadioContentType: 'determine_radio_content_type_prompt',
    bucketDefinitionErrorRate: 'bucket_definition_error_rate',
    chatGptModel: 'chatgpt_model',
    chatGptMaxTokens: 'chatgpt_max_tokens',
    chatGptTemperature: 'chatgpt_temperature',
    chatGptTopP: 'chatgpt_top_p',
    chatGptFrequencyPenalty: 'chatgpt_frequency_penalty',
    chatGptPresencePenalty: 'chatgpt_presence_penalty',
    radioSegmentContent: 'radio_segment_content',
    radioSegmentErrorRate: 'radio_segment_error_rate',
  };

  const apiSettings = {};
  Object.keys(frontendSettings).forEach(frontendKey => {
    const apiKey = keyMapping[frontendKey] || frontendKey;
    apiSettings[apiKey] = frontendSettings[frontendKey];
  });

  // Add content_type_prompt if determineRadioContentType exists
  if (frontendSettings.determineRadioContentType !== undefined) {
    apiSettings.content_type_prompt = frontendSettings.determineRadioContentType;
  }

  return apiSettings;
};

// Helper function to convert buckets to API format
const convertBucketsToApiFormat = (buckets) => {
  return buckets.map(bucket => {
    // For deleted buckets, only send id and is_deleted
    if (bucket.is_deleted) {
      return {
        id: bucket.id,
        is_deleted: true
      };
    }
    // For regular buckets, send all fields
    const apiBucket = {
      id: bucket.id,
      title: bucket.name,
      description: bucket.value,
      category: bucket.category || '',
      is_deleted: false
    };
    // Only include prompt if it exists
    if (bucket.prompt) {
      apiBucket.prompt = bucket.prompt;
    }
    return apiBucket;
  });
};

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    const response = await axiosInstance.get('/settings');
    return {
      settingsId: response.data.settings_id,
      settings: {
        openAiTranscriptionApi: response.data.settings.openai_api_key || '',
        openAiOrganisationalId: response.data.settings.openai_org_id || '',
        googleCloudClientId: response.data.settings.google_client_id || '',
        googleCloudClientSecret: response.data.settings.google_client_secret || '',
        // assemblyAiUser: response.data.settings.assemblyai_user || '',
        // assemblyAiPassword: response.data.settings.assemblyai_password || '',
        // assemblyAiApi: response.data.settings.assemblyai_api_key || '',
        acrCloudApi: response.data.settings.acr_cloud_api_key || '',
        revAiAccessToken: response.data.settings.revai_access_token || '',
        revAiAuthorization: response.data.settings.revai_authorization || '',
        summariseTranscript: response.data.settings.summarize_transcript_prompt || '',
        sentimentAnalysis: response.data.settings.sentiment_analysis_prompt || '',
        generalTopicsPrompt: response.data.settings.general_topics_prompt || '',
        iabTopicsPrompt: response.data.settings.iab_topics_prompt || '',
        bucketPrompt: response.data.settings.bucket_prompt || '',
        determineRadioContentType: response.data.settings.content_type_prompt || '',
        bucketDefinitionErrorRate: response.data.settings.bucket_definition_error_rate || response.data.settings.bucket_error_rate || '',
        chatGptModel: response.data.settings.chatgpt_model || '',
        chatGptMaxTokens: response.data.settings.chatgpt_max_tokens || '',
        chatGptTemperature: response.data.settings.chatgpt_temperature || '',
        chatGptTopP: response.data.settings.chatgpt_top_p || '',
        chatGptFrequencyPenalty: response.data.settings.chatgpt_frequency_penalty || '',
        chatGptPresencePenalty: response.data.settings.chatgpt_presence_penalty || '',
        radioSegmentContent: response.data.settings.radio_segment_content || '',
        radioSegmentErrorRate: response.data.settings.radio_segment_error_rate || '',
      },
      buckets: response.data.buckets
        .filter(bucket => !bucket.is_deleted) // Filter out deleted buckets from frontend state
        .map(bucket => ({
          id: bucket.id,
          name: bucket.title,
          value: bucket.description,
          category: bucket.category || '',
          prompt: bucket.prompt,
          createdAt: bucket.created_at || new Date().toISOString()
        }))
    };
  }
);

export const updateSetting = createAsyncThunk(
  'settings/updateSetting',
  async ({ key, value }, { getState, rejectWithValue }) => {
    const { settings, settingsId, buckets } = getState().settings;
    
    // Update the setting in frontend format
    const updatedFrontendSettings = { ...settings, [key]: value };

    // Convert all settings to API format
    const apiSettings = convertSettingsToApiFormat(updatedFrontendSettings);
    
    // Convert buckets to API format
    const apiBuckets = convertBucketsToApiFormat(buckets);

    try {
      const response = await axiosInstance.post('/settings', {
        settings: {
          ...apiSettings,
          id: settingsId   
        },
        buckets: apiBuckets
      });

      return { key, value };
    } catch (error) {
      // Parse API error response
      let errorMessage = 'Failed to update setting';
      
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        
        // Handle bucket validation errors
        if (apiError.buckets && Array.isArray(apiError.buckets)) {
          const bucketErrors = apiError.buckets
            .map((bucketError, index) => {
              // Check for category field error
              if (bucketError.category && Array.isArray(bucketError.category)) {
                return `Bucket ${index + 1}: Category field is required`;
              }
              // Handle other field errors dynamically
              const fieldErrors = Object.entries(bucketError)
                .filter(([key, value]) => Array.isArray(value) && value.length > 0)
                .map(([fieldName, errors]) => {
                  const fieldLabel = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                  return `${fieldLabel} field: ${errors.join(', ')}`;
                });
              
              if (fieldErrors.length > 0) {
                return `Bucket ${index + 1}: ${fieldErrors.join('; ')}`;
              }
              return null;
            })
            .filter(Boolean);
          
          if (bucketErrors.length > 0) {
            errorMessage = `Validation Error: ${bucketErrors.join('; ')}`;
          }
        } else if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const addBucket = createAsyncThunk(
  'settings/addBucket',
  async (bucketData, { getState, rejectWithValue }) => {
    const { settings, settingsId, buckets } = getState().settings;
    
    const newBucket = {
      title: bucketData.name,
      description: bucketData.value,
      category: bucketData.category || '',
      prompt: bucketData.prompt || ''
    };

    // Convert all settings to API format
    const apiSettings = convertSettingsToApiFormat(settings);
    
    // Convert existing buckets to API format
    const existingApiBuckets = convertBucketsToApiFormat(buckets);
    
    // Add the new bucket (without id, backend will assign it)
    const newApiBucket = {
      title: bucketData.name,
      description: bucketData.value,
      category: bucketData.category || '',
      is_deleted: false
    };
    if (bucketData.prompt) {
      newApiBucket.prompt = bucketData.prompt;
    }

    try {
      const response = await axiosInstance.post('/settings', {
        settings: {
          ...apiSettings,
          id: settingsId
        },
        buckets: [
          ...existingApiBuckets,
          newApiBucket
        ]
      });

      // Find the newly created bucket in the response
      const newBucketId = response.data.bucket_ids.find(
        id => !buckets.some(b => b.id === id)
      );

      return {
        id: newBucketId,
        name: bucketData.name,
        value: bucketData.value,
        category: bucketData.category || '',
        prompt: bucketData.prompt || '',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      // Handle both 'error' and 'message' fields from backend response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create bucket';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateBucket = createAsyncThunk(
  'settings/updateBucket',
  async ({ id, name, value, category, prompt }, { getState, rejectWithValue }) => {
    const { settings, settingsId, buckets } = getState().settings;
    
    // Convert all settings to API format
    const apiSettings = convertSettingsToApiFormat(settings);
    
    // Update the bucket in frontend format first
    const updatedBuckets = buckets.map(bucket => {
      if (bucket.id === id) {
        return {
          ...bucket,
          name,
          value,
          category: category || bucket.category || '',
          prompt: prompt !== undefined ? prompt : bucket.prompt
        };
      }
      return bucket;
    });
    
    // Convert buckets to API format
    const apiBuckets = convertBucketsToApiFormat(updatedBuckets);
    
    try {
      await axiosInstance.post('/settings', {
        settings: {
          ...apiSettings,
          id: settingsId
        },
        buckets: apiBuckets
      });

      return { id, name, value, category: category || '', prompt };
    } catch (error) {
      // Handle both 'error' and 'message' fields from backend response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update bucket';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteBucket = createAsyncThunk(
  'settings/deleteBucket',
  async (bucketId, { getState, rejectWithValue }) => {
    const { settings, settingsId, buckets } = getState().settings;
    
    // Convert all settings to API format
    const apiSettings = convertSettingsToApiFormat(settings);
    
    // Mark the bucket as deleted in frontend format
    const updatedBuckets = buckets.map(bucket => {
      if (bucket.id === bucketId) {
        return {
          ...bucket,
          is_deleted: true
        };
      }
      return bucket;
    });
    
    // Convert buckets to API format (will handle is_deleted properly)
    const apiBuckets = convertBucketsToApiFormat(updatedBuckets);
    
    try {
      await axiosInstance.post('/settings', {
        settings: {
          ...apiSettings,
          id: settingsId
        },
        buckets: apiBuckets
      });

      return bucketId;
    } catch (error) {
      // Handle both 'error' and 'message' fields from backend response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete bucket';
      return rejectWithValue(errorMessage);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    settings: {},
    settingsId: null,
    buckets: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settingsId = action.payload.settingsId;
        state.settings = action.payload.settings;
        state.buckets = action.payload.buckets;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update setting
      .addCase(updateSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.loading = false;
        const { key, value } = action.payload;
        state.settings[key] = value;
      })
      .addCase(updateSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed to update setting';
      })
      // Add bucket
      .addCase(addBucket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBucket.fulfilled, (state, action) => {
        state.loading = false;
        state.buckets.push(action.payload);
      })
      .addCase(addBucket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed to create bucket';
      })
      // Update bucket
      .addCase(updateBucket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBucket.fulfilled, (state, action) => {
        state.loading = false;
        const { id, name, value, category, prompt } = action.payload;
        const bucket = state.buckets.find(bucket => bucket.id === id);
        if (bucket) {
          bucket.name = name;
          bucket.value = value;
          if (category !== undefined) {
            bucket.category = category;
          }
          if (prompt !== undefined) {
            bucket.prompt = prompt;
          }
        }
      })
      .addCase(updateBucket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed to update bucket';
      })
      // Delete bucket
      .addCase(deleteBucket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBucket.fulfilled, (state, action) => {
        state.loading = false;
        state.buckets = state.buckets.filter(bucket => bucket.id !== action.payload);
      })
      .addCase(deleteBucket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed to delete bucket';
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;