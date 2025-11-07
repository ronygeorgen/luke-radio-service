import { axiosInstance } from './api';

export const audioManagementApi = {
  // Category APIs
  getCategories: () => axiosInstance.get('/segmentor/unrecognized-categories/'),
  createCategory: (data) => axiosInstance.post('/segmentor/unrecognized-categories/', data),
  updateCategory: (id, data) => axiosInstance.patch(`/segmentor/unrecognized-categories/${id}/`, data),
  deleteCategory: (id) => axiosInstance.delete(`/segmentor/unrecognized-categories/${id}/`),
  
  // Title Mapping Rules APIs
  createTitleRule: (data) => axiosInstance.post('/segmentor/title-mapping-rules/', data),
  updateTitleRule: (id, data) => axiosInstance.put(`/segmentor/title-mapping-rules/${id}/`, data),
  deleteTitleRule: (id) => axiosInstance.delete(`/segmentor/title-mapping-rules/${id}/`, data),
  getCategoryTitles: (categoryId) => axiosInstance.get(`/segmentor/categories/${categoryId}/titles/`),
  
  // Merge Audio Segments
  mergeSegments: (segmentIds) => axiosInstance.post('/process_segments', { segment_ids: segmentIds }),
};