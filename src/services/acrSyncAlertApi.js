// import { axiosInstance } from './api';

/**
 * ACR Cloud sync-delay alert settings.
 * Backend endpoints are not ready yet — fill these in when they land.
 *
 * Expected payload shape (adjust when the real API lands):
 * {
 *   emails: string[]
 * }
 */

export const fetchAcrSyncAlertSettings = async (channelId) => {
  // TODO: GET endpoint, e.g. `/channels/${channelId}/acr-sync-alerts`
  // const { data } = await axiosInstance.get(`/channels/${channelId}/acr-sync-alerts`);
  // return data;
  void channelId;
  return {
    emails: [''],
  };
};

export const saveAcrSyncAlertSettings = async (channelId, payload) => {
  // TODO: PUT/PATCH endpoint, e.g. `/channels/${channelId}/acr-sync-alerts`
  // const { data } = await axiosInstance.put(`/channels/${channelId}/acr-sync-alerts`, payload);
  // return data;
  void channelId;
  return payload;
};
