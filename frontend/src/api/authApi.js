import axiosClient from './axiosClient';

export const getProfile = async () => {
  const response = await axiosClient.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axiosClient.patch('/auth/profile', profileData);
  return response.data;
};

