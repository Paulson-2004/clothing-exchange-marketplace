import axiosClient from './axiosClient';

export const createSwapRequest = async ({ requestedListingId, offeredListingId }) => {
  const response = await axiosClient.post('/swaps', { requestedListingId, offeredListingId });
  return response.data;
};

export const getIncomingRequests = async () => {
  const response = await axiosClient.get('/swaps/incoming');
  return response.data;
};

export const getSentRequests = async () => {
  const response = await axiosClient.get('/swaps/sent');
  return response.data;
};

export const acceptSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/accept`);
  return response.data;
};

export const rejectSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/reject`);
  return response.data;
};

export const cancelSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/cancel`);
  return response.data;
};

export const completeSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/complete`);
  return response.data;
};
