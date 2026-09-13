import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../api/adminApi';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminStats();
      setStats(data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <Loader message="Loading admin dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStats} />;

  // Destructure for easy access
  const { users, listings, swaps, messages } = stats;

  return (
    <div className="page-container admin-page-wide admin-dashboard-page">
      <div className="admin-header" style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Platform overview and moderation control center.
        </p>
      </div>

      {/* 2. PLATFORM OVERVIEW */}
      <div className="admin-platform-overview">
        <div className="admin-overview-metric">
          <div className="admin-metric-value">{users.total}</div>
          <div className="admin-metric-label">Users</div>
        </div>
        <div className="admin-overview-metric">
          <div className="admin-metric-value">{listings.total}</div>
          <div className="admin-metric-label">Listings</div>
        </div>
        <div className="admin-overview-metric">
          <div className="admin-metric-value">{listings.available}</div>
          <div className="admin-metric-label">Available</div>
        </div>
        <div className="admin-overview-metric">
          <div className="admin-metric-value">{swaps.total}</div>
          <div className="admin-metric-label">Swap Requests</div>
        </div>
        <div className="admin-overview-metric">
          <div className="admin-metric-value">{swaps.completed}</div>
          <div className="admin-metric-label">Completed</div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="dashboard-main-col">
          {/* 3. NEEDS ATTENTION / MODERATION */}
          <section className="admin-section-editorial">
            <h2>Needs Attention</h2>
            <div className="admin-empty-queue">
              <h3>No Action Required</h3>
              <p>Platform operations are running smoothly. There are currently no items flagged for manual moderation.</p>
            </div>
          </section>

          {/* 4. LISTING OVERVIEW */}
          <section className="admin-section-editorial">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Listings</h2>
              <Link to="/admin/listings" style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', textDecoration: 'none', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Manage Listings &rarr;
              </Link>
            </div>
            
            <div className="admin-status-breakdown">
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot available"></span> Available</span>
                <span className="admin-status-count">{listings.available}</span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot pending"></span> Pending</span>
                <span className="admin-status-count">{listings.pending}</span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot completed"></span> Swapped</span>
                <span className="admin-status-count">{listings.swapped}</span>
              </div>
            </div>
          </section>

          {/* 5. SWAP ACTIVITY */}
          <section className="admin-section-editorial">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Swap Activity</h2>
              <Link to="/admin/swaps" style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', textDecoration: 'none', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                View All Swaps &rarr;
              </Link>
            </div>

            <div className="admin-status-breakdown">
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot pending"></span> Pending</span>
                <span className="admin-status-count">{swaps.pending}</span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot available"></span> Accepted</span>
                <span className="admin-status-count">{swaps.accepted}</span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot completed"></span> Completed</span>
                <span className="admin-status-count">{swaps.completed}</span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot rejected"></span> Rejected</span>
                <span className="admin-status-count">{swaps.rejected}</span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label"><span className="admin-status-dot cancelled"></span> Cancelled</span>
                <span className="admin-status-count">{swaps.cancelled}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="dashboard-side-col">
          {/* 7. QUICK ADMIN ACTIONS */}
          <section className="admin-section-editorial">
            <h2>Admin Tools</h2>
            <div className="admin-tool-links">
              <Link to="/admin/users" className="admin-tool-link">Manage Users <span>&rarr;</span></Link>
              <Link to="/admin/listings" className="admin-tool-link">Manage Listings <span>&rarr;</span></Link>
              <Link to="/admin/swaps" className="admin-tool-link">Review Swap Requests <span>&rarr;</span></Link>
            </div>
          </section>
          
          <section className="admin-section-editorial">
            <h2>System Summary</h2>
            <div className="admin-status-breakdown">
              <div className="admin-status-row" style={{ padding: '0.75rem 0' }}>
                <span className="admin-status-label" style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Total Users</span>
                <span className="admin-status-count" style={{ fontSize: '1.1rem' }}>{users.total}</span>
              </div>
              <div className="admin-status-row" style={{ padding: '0.75rem 0' }}>
                <span className="admin-status-label" style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Admin Accounts</span>
                <span className="admin-status-count" style={{ fontSize: '1.1rem' }}>{users.admins}</span>
              </div>
              <div className="admin-status-row" style={{ padding: '0.75rem 0' }}>
                <span className="admin-status-label" style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Messages Exchanged</span>
                <span className="admin-status-count" style={{ fontSize: '1.1rem' }}>{messages.total}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
