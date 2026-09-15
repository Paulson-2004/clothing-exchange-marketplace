// User profile and account management API.
//
// login, register, and logout are intentionally NOT here — they live in
// AuthContext because they need to update the global React auth state
// (e.g. setUser) in addition to making a network call. The functions
// here are pure data operations that don't require global state changes.
// User-facing profile API endpoints.
// Note: Login, register, and logout are handled directly inside AuthContext.jsx
// instead of here, because they need to update the global React state.
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
