import axiosInstance from './axiosInstance';

export const getDraftsApi = () =>
  axiosInstance.get('/posts');

export const getPostDetailApi = (postId) =>
  axiosInstance.get(`/posts/${postId}`);

export const uploadPostApi = (formData) =>
  axiosInstance.post('/posts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateDraftApi = (postId, data) =>
  axiosInstance.put(`/posts/${postId}`, data);

export const deleteDraftApi = (postId) =>
  axiosInstance.delete(`/posts/${postId}`);

export const generateCaptionApi = (postId, data) =>
  axiosInstance.post(`/posts/${postId}/generate-caption`, data);

export const regenerateCaptionApi = (postId) =>
  axiosInstance.post(`/posts/${postId}/regenerate`);

export const schedulePostApi = (postId, data) =>
  axiosInstance.post(`/posts/${postId}/schedule`, data);

export const cancelScheduleApi = (postId) =>
  axiosInstance.delete(`/posts/${postId}/schedule`);

export const publishPostApi = (postId, data) =>
  axiosInstance.post(`/posts/${postId}/publish`, data);

export const getPublishedPostsApi = () =>
  axiosInstance.get('/posts/published');

export const uploadVideoPostApi = (formData) =>
  axiosInstance.post('/posts/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const publishVideoApi = (postId, data) =>
  axiosInstance.post(`/posts/${postId}/publish-video`, data);