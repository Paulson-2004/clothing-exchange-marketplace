import axiosClient from './axiosClient';

// All listing-related API calls live here so components don't build
// URLs or FormData logic themselves.

// SHORT-LIVED MARKETPLACE CACHE:
// GET /api/listings is public and identical for every visitor, so the most
// recent pages are kept in memory for the current tab session. The
// marketplace can then re-render instantly when the user comes back from an
// item page (instead of showing a spinner) while a fresh request revalidates
// the data in the background. Listing status is never trusted from this
// cache for swaps: Item Details always fetches fresh, and the backend
// enforces availability on every swap action.
const LISTINGS_CACHE_TTL_MS = 60 * 1000;
const LISTINGS_CACHE_MAX_ENTRIES = 20;
const listingsCache = new Map();

const buildListingParams = (filters = {}) => {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  return params;
};

const listingsCacheKey = (params) =>
  JSON.stringify(params, Object.keys(params).sort());

export const getCachedListings = (filters = {}) => {
  const entry = listingsCache.get(listingsCacheKey(buildListingParams(filters)));
  if (!entry) return null;
  if (Date.now() - entry.storedAt > LISTINGS_CACHE_TTL_MS) return null;
  return entry.data;
};

export const clearListingsCache = () => {
  listingsCache.clear();
};

export const getListings = async (filters = {}, { signal } = {}) => {
  const params = buildListingParams(filters);
  const response = await axiosClient.get('/listings', { params, signal });

  const key = listingsCacheKey(params);
  listingsCache.delete(key);
  listingsCache.set(key, { data: response.data, storedAt: Date.now() });
  if (listingsCache.size > LISTINGS_CACHE_MAX_ENTRIES) {
    // Map preserves insertion order, so the first key is the oldest entry.
    listingsCache.delete(listingsCache.keys().next().value);
  }

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
  clearListingsCache();
  return response.data;
};

export const updateListing = async (id, fields, imageFiles = []) => {
  const formData = buildListingFormData(fields, imageFiles);
  const response = await axiosClient.put(`/listings/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  clearListingsCache();
  return response.data;
};

export const deleteListing = async (id) => {
  const response = await axiosClient.delete(`/listings/${id}`);
  clearListingsCache();
  return response.data;
};

// GET /api/listings/compare?listingA=<id>&listingB=<id>
// Returns a structured value comparison from the backend.
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
// Returns location + value compatible swap match suggestions.
export const getListingMatches = async (id) => {
  const response = await axiosClient.get(`/listings/${id}/matches`);
  return response.data;
};
