// Swap request API — thin wrappers around the /swaps REST endpoints.
//
// All state transitions (accept, reject, cancel, complete) use PATCH
// so the backend can apply business rules (e.g. marking both items as
// 'pending' on accept, or 'swapped' on complete) in one place.
import axiosClient from './axiosClient';

// Creates a new swap request: the requester offers offeredListingId in
// exchange for requestedListingId owned by another user.
export const createSwapRequest = async ({ requestedListingId, offeredListingId }) => {
  const response = await axiosClient.post('/swaps', { requestedListingId, offeredListingId });
  return response.data;
};

// Returns swap requests where the current user is the recipient (owner
// of the requested listing). Used by the Swap Requests page.
export const getIncomingRequests = async () => {
  const response = await axiosClient.get('/swaps/incoming');
  return response.data;
};

// Returns swap requests created by the current user. Used by the Swap
// Requests page to show the "Sent" tab.
export const getSentRequests = async () => {
  const response = await axiosClient.get('/swaps/sent');
  return response.data;
};

// Accepts an incoming request; the backend marks both listings as 'pending'.
export const acceptSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/accept`);
  return response.data;
};

// Declines an incoming request; both listings return to 'available'.
export const rejectSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/reject`);
  return response.data;
};

// Lets the requester withdraw their own pending request.
export const cancelSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/cancel`);
  return response.data;
};

// Marks an accepted swap as completed; the backend marks both listings
// as 'swapped' so they no longer appear as available.
export const completeSwapRequest = async (id) => {
  const response = await axiosClient.patch(`/swaps/${id}/complete`);
  return response.data;
};
