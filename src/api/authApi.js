import axiosInstance from './axiosInstance';

export const registerApi = (data) =>
  axiosInstance.post('/auth/register', data);

export const loginApi = (data) =>
  axiosInstance.post('/auth/login', data);