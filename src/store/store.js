// store.js
import { configureStore } from '@reduxjs/toolkit';
import channelReducer from './slices/channelSlice';
import settingsReducer from './slices/settingsSlice';
import audioSegmentsReducer from './slices/audioSegmentsSlice';
import dashboardReducer from './slices/dashboardSlice';
import shiftAnalyticsReducer from './slices/shiftAnalyticsSlice';
import dashboardSettingsReducer from './slices/dashboardSettingsSlice';
import topicModalReducer from './slices/topicModalSlice';
import reportReducer from './slices/reportSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    channels: channelReducer,
    settings: settingsReducer,
    audioSegments: audioSegmentsReducer,
    dashboard: dashboardReducer, 
    shiftAnalytics: shiftAnalyticsReducer, 
    dashboardSettings: dashboardSettingsReducer,
    topicModal: topicModalReducer,
    reports: reportReducer,
    auth: authReducer
  },
});

export default store;