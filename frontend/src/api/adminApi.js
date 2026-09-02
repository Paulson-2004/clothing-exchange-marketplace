// Phase 8 — Admin API client.
//
// All admin-specific API calls. Uses the shared axiosClient instance
// (withCredentials: true) so the httpOnly JWT cookie is automatically
// sent with every request. The admin authorization check happens
// server-side via protect + requireAdmin middleware.

import axiosClient from './axiosClient';

// ─── Dashboard ─────────────────────────────────────────────────────

export const getAdminStats = async () => {
  const { data } = await axiosClient.get('/admin/stats');
  return data;
};

// ─── Users ─────────────────────────────────────────────────────────

export const getAdminUsers = async (params = {}) => {
  const { data } = await axiosClient.get('/admin/users', { params });
  return data;
};

export const getAdminUserById = async (id) => {
  const { data } = await axiosClient.get(`/admin/users/${id}`);
  return data;
};

export const toggleUserRole = async (id) => {
  const { data } = await axiosClient.patch(`/admin/users/${id}/role`);
  return data;
};

// ─── Listings ──────────────────────────────────────────────────────

export const getAdminListings = async (params = {}) => {
  const { data } = await axiosClient.get('/admin/listings', { params });
  return data;
};

export const adminDeleteListing = async (id) => {
  const { data } = await axiosClient.delete(`/admin/listings/${id}`);
  return data;
};

// ─── Swaps ─────────────────────────────────────────────────────────

export const getAdminSwaps = async (params = {}) => {
  const { data } = await axiosClient.get('/admin/swaps', { params });
  return data;
};
