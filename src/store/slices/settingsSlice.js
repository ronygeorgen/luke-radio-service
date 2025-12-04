// settingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '../../services/api';

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
        bucketDefinitionErrorRate: response.data.settings.bucket_error_rate || '',
        chatGptModel: response.data.settings.chatgpt_model || '',
        chatGptMaxTokens: response.data.settings.chatgpt_max_tokens || '',
        chatGptTemperature: response.data.settings.chatgpt_temperature || '',
        chatGptTopP: response.data.settings.chatgpt_top_p || '',
        chatGptFrequencyPenalty: response.data.settings.chatgpt_frequency_penalty || '',
        chatGptPresencePenalty: response.data.settings.chatgpt_presence_penalty || '',
        radioSegmentContent: response.data.settings.radio_segment_content || '',
        radioSegmentErrorRate: response.data.settings.radio_segment_error_rate || '',
      },
      buckets: response.data.buckets.map(bucket => ({
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
    
    // Map frontend keys to API keys
    const keyMapping = {
      openAiTranscriptionApi: 'openai_api_key',
      openAiOrganisationalId: 'openai_org_id',
      googleCloudClientId: 'google_client_id',
      googleCloudClientSecret: 'google_client_secret',
      // assemblyAiUser: 'assemblyai_user',
      // assemblyAiPassword: 'assemblyai_password',
      // assemblyAiApi: 'assemblyai_api_key',
      acrCloudApi: 'acr_cloud_api_key',
      revAiAccessToken: 'revai_access_token',
      revAiAuthorization: 'revai_authorization',
      summariseTranscript: 'summarize_transcript_prompt',
      sentimentAnalysis: 'sentiment_analysis_prompt',
      generalTopicsPrompt: 'general_topics_prompt',
      iabTopicsPrompt: 'iab_topics_prompt',
      bucketPrompt: 'bucket_prompt',
      determineRadioContentType: 'radio_content_type_prompt',
      bucketDefinitionErrorRate: 'bucket_error_rate',
      chatGptModel: 'chatgpt_model',
      chatGptMaxTokens: 'chatgpt_max_tokens',
      chatGptTemperature: 'chatgpt_temperature',
      chatGptTopP: 'chatgpt_top_p',
      chatGptFrequencyPenalty: 'chatgpt_frequency_penalty',
      chatGptPresencePenalty: 'chatgpt_presence_penalty',
      radioSegmentContent: 'radio_segment_content',
      radioSegmentErrorRate: 'radio_segment_error_rate',
    };

    const apiKey = keyMapping[key] || key;
    const updatedSettings = { ...settings, [apiKey]: value };

    // If updating determineRadioContentType, also add content_type_prompt with the same value
    if (key === 'determineRadioContentType') {
      updatedSettings.content_type_prompt = value;
    }

    try {
      const response = await axiosInstance.put('/settings', {
        settings: {
          ...updatedSettings,
          id: settingsId   
        },
        buckets: buckets.map(bucket => ({
          bucket_id: bucket.id,
          title: bucket.name,
          description: bucket.value,
          category: bucket.category || '',
          prompt: bucket.prompt
        }))
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
  async (bucketData, { getState }) => {
    const { settings, settingsId, buckets } = getState().settings;
    
    const newBucket = {
      title: bucketData.name,
      description: bucketData.value,
      category: bucketData.category || '',
      prompt: bucketData.prompt || ''
    };

    const response = await axiosInstance.put('/settings', {
      settings: {
        ...settings,
        id: settingsId
      },
      buckets: [
        ...buckets.map(bucket => ({
          bucket_id: bucket.id,
          title: bucket.name,
          description: bucket.value,
          category: bucket.category || '',
          prompt: bucket.prompt
        })),
        newBucket
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
  }
);

export const updateBucket = createAsyncThunk(
  'settings/updateBucket',
  async ({ id, name, value, category, prompt }, { getState }) => {
    const { settings, settingsId, buckets } = getState().settings;
    
    await axiosInstance.put('/settings', {
      settings: {
        ...settings,
        id: settingsId
      },
      buckets: buckets.map(bucket => ({
        bucket_id: bucket.id,
        title: bucket.id === id ? name : bucket.name,
        description: bucket.id === id ? value : bucket.value,
        category: bucket.id === id ? (category || bucket.category || '') : (bucket.category || ''),
        prompt: bucket.id === id ? (prompt || bucket.prompt) : bucket.prompt
      }))
    });

    return { id, name, value, category: category || '', prompt };
  }
);

export const deleteBucket = createAsyncThunk(
  'settings/deleteBucket',
  async (bucketId, { getState }) => {
    const { settings, settingsId, buckets } = getState().settings;
    
    await axiosInstance.put('/settings', {
      settings: {
        ...settings,
        id: settingsId
      },
      buckets: buckets
        .filter(bucket => bucket.id !== bucketId)
        .map(bucket => ({
          id: bucket.id,
          title: bucket.name,
          description: bucket.value,
          category: bucket.category || '',
          prompt: bucket.prompt
        }))
    });

    return bucketId;
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
        state.error = action.error.message;
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
        state.error = action.error.message;
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
        state.error = action.error.message;
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;