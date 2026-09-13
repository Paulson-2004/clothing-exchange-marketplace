import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminListings, adminDeleteListing, getAdminStats } from '../api/adminApi';
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
  const [stats, setStats] = useState(null);

  const fetchInitialData = async () => {
    try {
      const statsData = await getAdminStats();
      setStats(statsData.stats.listings);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

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
    fetchInitialData();
  }, []);

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
      fetchInitialData(); // Refresh stats
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete listing');
      setDeleteListing(null);
    }
  };

  return (
    <div className="page-container admin-page-wide admin-listings-page">
      <div className="admin-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Admin / Listings</div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>
            Listings
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '1.05rem' }}>
            Manage and review the clothing available on the ReWear marketplace.
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Dashboard &rarr;</Link>
      </div>

      {/* Inventory Overview */}
      {stats && (
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.total}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary-dark)', fontWeight: 500 }}>Available</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.available}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d97706', fontWeight: 500 }}>Pending</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.pending}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4d7c0f', fontWeight: 500 }}>Swapped</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.swapped}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-workspace-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', minWidth: '300px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by title or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '0' }}>Search</button>
        </form>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit' }}
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="swapped">Swapped</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit' }}
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
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {totalCount} listing{totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {loading && <Loader message="Loading listings..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchListings(page)} />}

      {!loading && !error && listings.length === 0 && (
        <EmptyState title={search || statusFilter || categoryFilter ? "No listings match your filters" : "No listings yet"} message={search || statusFilter || categoryFilter ? "Try adjusting your search or filters." : "The marketplace currently has no listed items."} />
      )}

      {!loading && !error && listings.length > 0 && (
        <>
          <div className="admin-workspace-table-container">
            <table className="admin-workspace-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Image</th>
                  <th style={{ width: '25%' }}>Listing</th>
                  <th style={{ width: '20%' }}>Owner</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%' }}>Value</th>
                  <th style={{ width: '15%' }}>Location</th>
                  <th style={{ width: '10%' }}>Created</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
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
          message={`Are you sure you want to completely delete "${deleteListing.title}"? This action cannot be undone and will affect any pending swaps.`}
          confirmLabel="Permanently Delete Listing"
          onConfirm={handleDelete}
          onCancel={() => setDeleteListing(null)}
          danger={true}
        />
      )}
    </div>
  );
}

export default AdminListingsPage;

