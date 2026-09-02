import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSwaps } from '../api/adminApi';
import AdminSwapRow from '../components/admin/AdminSwapRow';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

function AdminSwapsPage() {
  const [swaps, setSwaps] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSwaps = async (p = page) => {
    try {
      setLoading(true);
      setError('');
      const params = { page: p, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const data = await getAdminSwaps(params);
      setSwaps(data.swaps);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load swap requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>Swap Activity Monitor</h1>
        <Link to="/admin" className="btn btn-secondary btn-sm">← Back to Dashboard</Link>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <p className="admin-count">{totalCount} swap request{totalCount !== 1 ? 's' : ''} found</p>

      {loading && <Loader message="Loading swap requests..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchSwaps(page)} />}

      {!loading && !error && swaps.length === 0 && (
        <EmptyState title="No swap requests found" message="Try adjusting your filters." />
      )}

      {!loading && !error && swaps.length > 0 && (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Requester</th>
                  <th>Requested Item</th>
                  <th>Item Owner</th>
                  <th>Offered Item</th>
                  <th>Created</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {swaps.map((s) => (
                  <AdminSwapRow key={s._id} swap={s} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchSwaps(p)} />
        </>
      )}
    </div>
  );
}

export default AdminSwapsPage;
