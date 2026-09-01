import axiosClient from './axiosClient';

// All listing-related API calls live here so components don't build
// URLs or FormData logic themselves.

export const getListings = async (filters = {}) => {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  const response = await axiosClient.get('/listings', { params });
  return response.data;
};

export const getListingById = async (id) => {
  const response = await axiosClient.get(`/listings/${id}`);
  return response.data;
};

export const getMyListings = async () => {
  const response = await axiosClient.get('/listings/mine/all');
  return response.data;
};

export const getEstimatedValue = async ({ category, brand, condition }) => {
  const response = await axiosClient.get('/listings/estimate-value', {
    params: { category, brand, condition },
  });
  return response.data.estimatedValue;
};

// Builds the multipart/form-data body needed whenever images are involved.
const buildListingFormData = (fields, imageFiles) => {
  const formData = new FormData();
  formData.append('title', fields.title);
  formData.append('category', fields.category);
  formData.append('brand', fields.brand);
  formData.append('size', fields.size);
  formData.append('condition', fields.condition);
  formData.append('description', fields.description);
  formData.append('estimatedValue', fields.estimatedValue);
  formData.append('city', fields.city || '');
  formData.append('state', fields.state || '');
  formData.append('country', fields.country || '');

  imageFiles.forEach((file) => {
    formData.append('images', file);
  });

  return formData;
};

export const createListing = async (fields, imageFiles) => {
  const formData = buildListingFormData(fields, imageFiles);
  const response = await axiosClient.post('/listings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateListing = async (id, fields, imageFiles = []) => {
  const formData = buildListingFormData(fields, imageFiles);
  const response = await axiosClient.put(`/listings/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteListing = async (id) => {
  const response = await axiosClient.delete(`/listings/${id}`);
  return response.data;
};

// GET /api/listings/compare?listingA=<id>&listingB=<id>
// Returns a structured value comparison from the backend (Phase 6).
// Components that have both listing objects already loaded should use
// the frontend/src/utils/valueComparator.js utility directly to avoid
// an extra network round-trip for what is purely informational display.
export const compareListings = async (listingAId, listingBId) => {
  const response = await axiosClient.get('/listings/compare', {
    params: { listingA: listingAId, listingB: listingBId },
  });
  return response.data;
};

// GET /api/listings/:id/matches
// Returns location + value compatible swap match suggestions (Phase 7).
export const getListingMatches = async (id) => {
  const response = await axiosClient.get(`/listings/${id}/matches`);
  return response.data;
};
