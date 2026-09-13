import axiosClient from './axiosClient';

export const getConversations = async () => {
  const response = await axiosClient.get('/chat/conversations');
  return response.data;
};

// Creates a new conversation, or returns the existing one for the same
// pair of users (+ same swap request, if provided).
export const createOrFindConversation = async ({ otherUserId, swapRequestId }) => {
  const response = await axiosClient.post('/chat/conversations', { otherUserId, swapRequestId });
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await axiosClient.get(`/chat/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendMessage = async (conversationId, text) => {
  const response = await axiosClient.post(`/chat/conversations/${conversationId}/messages`, { text });
  return response.data;
};

export const markConversationRead = async (conversationId) => {
  const response = await axiosClient.patch(`/chat/conversations/${conversationId}/read`);
  return response.data;
};
