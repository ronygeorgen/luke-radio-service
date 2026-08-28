import { axiosInstance } from './api';

const settingsPath = (channelId) => `/monitoring/channels/${channelId}/settings/`;

export const getMonitoringErrorMessage = (err, fallback = 'Request failed') => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) return data.detail.filter(Boolean).join(' ');

  const fieldMessages = Object.entries(data)
    .flatMap(([key, value]) => {
      if (key === 'detail') return [];
      if (Array.isArray(value)) return value.map(String);
      if (typeof value === 'string') return [`${key}: ${value}`];
      return [];
    });

  return fieldMessages[0] || fallback;
};

export const fetchAcrSyncAlertSettings = async (channelId) => {
  const { data } = await axiosInstance.get(settingsPath(channelId));
  return data;
};

export const saveAcrSyncAlertSettings = async (channelId, payload) => {
  const { data } = await axiosInstance.put(settingsPath(channelId), payload);
  return data;
};
