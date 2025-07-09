import { configureStore } from '@reduxjs/toolkit';
import channelReducer from './slices/channelSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    channels: channelReducer,
    settings: settingsReducer,
  },
});

export default store;