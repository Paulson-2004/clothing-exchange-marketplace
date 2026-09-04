import axiosClient from './axiosClient';

export const getProfile = async () => {
  const response = await axiosClient.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axiosClient.patch('/auth/profile', profileData);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axiosClient.put('/auth/password', data);
  return response.data;
};

export const deleteAccount = async (password) => {
  const response = await axiosClient.delete('/auth/account', { data: { password } });
  return response.data;
};
