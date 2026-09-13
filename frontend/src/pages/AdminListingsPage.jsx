import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminListings, adminDeleteListing } from '../api/adminApi';
import AdminListingRow from '../components/admin/AdminListingRow';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteListing, setDeleteListing] = useState(null);

  const fetchListings = async (p = page) => {
    try {
      setLoading(true);
      setError('');
      const params = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await getAdminListings(params);
      setListings(data.listings);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings(1);
  };

  const handleDelete = async () => {
    if (!deleteListing) return;
    try {
      await adminDeleteListing(deleteListing._id);
      setDeleteListing(null);
      fetchListings(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete listing');
      setDeleteListing(null);
    }
  };

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>Listing Moderation</h1>
        <Link to="/admin" className="btn btn-secondary btn-sm">← Back to Dashboard</Link>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <form onSubmit={handleSearch} className="admin-search-form">
          <input
            type="text"
            placeholder="Search by title or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="swapped">Swapped</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All Categories</option>
          <option value="tops">Tops</option>
          <option value="bottoms">Bottoms</option>
          <option value="dresses">Dresses</option>
          <option value="outerwear">Outerwear</option>
          <option value="footwear">Footwear</option>
          <option value="accessories">Accessories</option>
          <option value="activewear">Activewear</option>
          <option value="other">Other</option>
        </select>
      </div>

      <p className="admin-count">{totalCount} listing{totalCount !== 1 ? 's' : ''} found</p>

      {loading && <Loader message="Loading listings..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchListings(page)} />}

      {!loading && !error && listings.length === 0 && (
        <EmptyState title="No listings found" message="Try adjusting your search or filters." />
      )}

      {!loading && !error && listings.length > 0 && (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Owner</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <AdminListingRow
                    key={l._id}
                    listing={l}
                    onDelete={(lst) => setDeleteListing(lst)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchListings(p)} />
        </>
      )}

      {deleteListing && (
        <ConfirmModal
          title="Delete Listing"
          message={`Are you sure you want to delete "${deleteListing.title}"? Any active swap requests involving this listing will be automatically cancelled. This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteListing(null)}
        />
      )}
    </div>
  );
}

export default AdminListingsPage;
