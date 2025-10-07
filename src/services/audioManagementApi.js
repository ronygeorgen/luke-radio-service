import { axiosInstance } from './api';

export const audioManagementApi = {
  // Category APIs
  getCategories: () => axiosInstance.get('/segmentor/unrecognized-categories/'),
  createCategory: (data) => axiosInstance.post('/segmentor/unrecognized-categories/', data),
  updateCategory: (id, data) => axiosInstance.patch(`/segmentor/unrecognized-categories/${id}/`, data),
  
  // Title Mapping Rules APIs
  createTitleRule: (data) => axiosInstance.post('/segmentor/title-mapping-rules/', data),
  deleteTitleRule: (id) => axiosInstance.delete(`/segmentor/title-mapping-rules/${id}/`),
  getCategoryTitles: (categoryId) => axiosInstance.get(`/segmentor/categories/${categoryId}/titles/`),
};