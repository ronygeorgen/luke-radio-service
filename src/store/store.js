// store.js
import { configureStore } from '@reduxjs/toolkit';
import channelReducer from './slices/channelSlice';
import settingsReducer from './slices/settingsSlice';
import audioSegmentsReducer from './slices/audioSegmentsSlice';
import dashboardReducer from './slices/dashboardSlice';
import shiftAnalyticsReducer from './slices/shiftAnalyticsSlice';

export const store = configureStore({
  reducer: {
    channels: channelReducer,
    settings: settingsReducer,
    audioSegments: audioSegmentsReducer,
    dashboard: dashboardReducer, 
    shiftAnalytics: shiftAnalyticsReducer, 
  },
});

export default store;