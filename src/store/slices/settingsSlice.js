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
    chatGptTemperature: 'chatgpt_temperature',
    chatGptTopP: 'chatgpt_top_p',
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
        chatGptTemperature: response.data.settings.chatgpt_temperature || '',
        chatGptTopP: response.data.settings.chatgpt_top_p || '',
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
  async ({ key, value }, { getState, rejectWithValue, dispatch }) => {
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

      const result = { key, value };
      
      // Refetch settings to ensure UI is in sync with backend
      dispatch(fetchSettings());
      
      return result;
    } catch (error) {
      // Parse API error response
      let errorMessage = 'Failed to update setting';
      
      // Handle settings field validation errors (e.g., openai_api_key errors)
      if (error.response?.data?.settings) {
        const settingsErrors = error.response.data.settings;
        const fieldErrors = [];
        
        Object.entries(settingsErrors).forEach(([fieldName, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            // Map backend field names to user-friendly labels
            const fieldLabelMap = {
              'openai_api_key': 'OpenAI API Key',
              'openai_org_id': 'OpenAI Organisational ID',
              'acr_cloud_api_key': 'ACR Cloud API Key',
              'revai_access_token': 'Rev.ai Access Token',
              'revai_authorization': 'Rev.ai Authorization',
              'google_client_id': 'Google Cloud Client ID',
              'google_client_secret': 'Google Cloud Client Secret',
            };
            
            const fieldLabel = fieldLabelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            fieldErrors.push(`${fieldLabel}: ${errors.join(', ')}`);
          }
        });
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('; ');
        }
      } else if (error.response?.data?.error) {
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
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Refetch settings even on error to ensure UI is in sync
      dispatch(fetchSettings());
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const addBucket = createAsyncThunk(
  'settings/addBucket',
  async (bucketData, { getState, rejectWithValue, dispatch }) => {
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
      // The response contains a buckets array with all buckets including the new one
      const existingBucketIds = new Set(buckets.map(b => b.id));
      
      // Find buckets in response that don't exist in our current state
      const newBucketsInResponse = response.data.buckets?.filter(
        bucket => !existingBucketIds.has(bucket.id) && !bucket.is_deleted
      ) || [];
      
      // The new bucket should be the one we just created
      // Match by title and description to ensure we get the right one
      let newBucketFromResponse = newBucketsInResponse.find(
        bucket => 
          bucket.title === bucketData.name && 
          bucket.description === bucketData.value &&
          bucket.category === bucketData.category
      );
      
      // If no exact match, take the first new bucket (should be the one we just added)
      if (!newBucketFromResponse && newBucketsInResponse.length > 0) {
        newBucketFromResponse = newBucketsInResponse[0];
      }
      
      if (!newBucketFromResponse) {
        throw new Error('New bucket not found in response');
      }

      const result = {
        id: newBucketFromResponse.id,
        name: newBucketFromResponse.title,
        value: newBucketFromResponse.description,
        category: newBucketFromResponse.category || '',
        prompt: newBucketFromResponse.prompt || '',
        createdAt: new Date().toISOString()
      };
      
      // Refetch settings to ensure UI is in sync with backend
      dispatch(fetchSettings());
      
      return result;
    } catch (error) {
      // Parse API error response
      let errorMessage = 'Failed to create bucket';
      
      // Handle settings field validation errors (e.g., openai_api_key errors)
      if (error.response?.data?.settings) {
        const settingsErrors = error.response.data.settings;
        const fieldErrors = [];
        
        Object.entries(settingsErrors).forEach(([fieldName, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            // Map backend field names to user-friendly labels
            const fieldLabelMap = {
              'openai_api_key': 'OpenAI API Key',
              'openai_org_id': 'OpenAI Organisational ID',
              'acr_cloud_api_key': 'ACR Cloud API Key',
              'revai_access_token': 'Rev.ai Access Token',
              'revai_authorization': 'Rev.ai Authorization',
              'google_client_id': 'Google Cloud Client ID',
              'google_client_secret': 'Google Cloud Client Secret',
            };
            
            const fieldLabel = fieldLabelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            fieldErrors.push(`${fieldLabel}: ${errors.join(', ')}`);
          }
        });
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('; ');
        }
      } else if (error.response?.data?.error) {
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
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Refetch settings even on error to ensure UI is in sync
      dispatch(fetchSettings());
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateBucket = createAsyncThunk(
  'settings/updateBucket',
  async ({ id, name, value, category, prompt }, { getState, rejectWithValue, dispatch }) => {
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

      const result = { id, name, value, category: category || '', prompt };
      
      // Refetch settings to ensure UI is in sync with backend
      dispatch(fetchSettings());
      
      return result;
    } catch (error) {
      // Parse API error response
      let errorMessage = 'Failed to update bucket';
      
      // Handle settings field validation errors (e.g., openai_api_key errors)
      if (error.response?.data?.settings) {
        const settingsErrors = error.response.data.settings;
        const fieldErrors = [];
        
        Object.entries(settingsErrors).forEach(([fieldName, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            // Map backend field names to user-friendly labels
            const fieldLabelMap = {
              'openai_api_key': 'OpenAI API Key',
              'openai_org_id': 'OpenAI Organisational ID',
              'acr_cloud_api_key': 'ACR Cloud API Key',
              'revai_access_token': 'Rev.ai Access Token',
              'revai_authorization': 'Rev.ai Authorization',
              'google_client_id': 'Google Cloud Client ID',
              'google_client_secret': 'Google Cloud Client Secret',
            };
            
            const fieldLabel = fieldLabelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            fieldErrors.push(`${fieldLabel}: ${errors.join(', ')}`);
          }
        });
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('; ');
        }
      } else if (error.response?.data?.error) {
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
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Refetch settings even on error to ensure UI is in sync
      dispatch(fetchSettings());
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteBucket = createAsyncThunk(
  'settings/deleteBucket',
  async (bucketId, { getState, rejectWithValue, dispatch }) => {
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

      // Refetch settings to ensure UI is in sync with backend
      dispatch(fetchSettings());
      
      return bucketId;
    } catch (error) {
      // Parse API error response
      let errorMessage = 'Failed to delete bucket';
      
      // Handle settings field validation errors (e.g., openai_api_key errors)
      if (error.response?.data?.settings) {
        const settingsErrors = error.response.data.settings;
        const fieldErrors = [];
        
        Object.entries(settingsErrors).forEach(([fieldName, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            // Map backend field names to user-friendly labels
            const fieldLabelMap = {
              'openai_api_key': 'OpenAI API Key',
              'openai_org_id': 'OpenAI Organisational ID',
              'acr_cloud_api_key': 'ACR Cloud API Key',
              'revai_access_token': 'Rev.ai Access Token',
              'revai_authorization': 'Rev.ai Authorization',
              'google_client_id': 'Google Cloud Client ID',
              'google_client_secret': 'Google Cloud Client Secret',
            };
            
            const fieldLabel = fieldLabelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            fieldErrors.push(`${fieldLabel}: ${errors.join(', ')}`);
          }
        });
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('; ');
        }
      } else if (error.response?.data?.error) {
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
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Refetch settings even on error to ensure UI is in sync
      dispatch(fetchSettings());
      
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
        // Check if bucket already exists to prevent duplicates
        const existingBucket = state.buckets.find(b => b.id === action.payload.id);
        if (!existingBucket) {
          state.buckets.push(action.payload);
        }
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