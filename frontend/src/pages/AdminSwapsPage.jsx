import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSwaps, getAdminStats } from '../api/adminApi';
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
  const [stats, setStats] = useState(null);

  const fetchInitialData = async () => {
    try {
      const statsData = await getAdminStats();
      setStats(statsData.stats.swaps);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

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
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSwaps(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="page-container admin-page-wide admin-swaps-page">
      <div className="admin-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Admin / Swap Requests</div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>
            Swap Requests
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '1.05rem' }}>
            Manage and review exchanges across the ReWear marketplace.
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Dashboard &rarr;</Link>
      </div>

      {/* Status Overview */}
      {stats && (
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.total}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d97706', fontWeight: 500 }}>Pending</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.pending}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary-dark)', fontWeight: 500 }}>Accepted</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.accepted}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4d7c0f', fontWeight: 500 }}>Completed</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.completed}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b91c1c', fontWeight: 500 }}>Rejected</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.rejected}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)', fontWeight: 500 }}>Cancelled</div>
            <div style={{ fontSize: '1.75rem', color: 'var(--color-text)' }}>{stats.cancelled}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-workspace-controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit', minWidth: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {totalCount} swap request{totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {loading && <Loader message="Loading swap requests..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchSwaps(page)} />}

      {!loading && !error && swaps.length === 0 && (
        <EmptyState title={statusFilter ? "No swap requests match your filter" : "No swap requests yet"} message={statusFilter ? "Try adjusting your status filter." : "The ReWear marketplace has not recorded any exchanges."} />
      )}

      {!loading && !error && swaps.length > 0 && (
        <>
          <div className="admin-workspace-table-container">
            <table className="admin-workspace-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '60%' }}>Exchange</th>
                  <th style={{ width: '15%' }}>Values</th>
                  <th style={{ width: '15%' }}>Created</th>
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

