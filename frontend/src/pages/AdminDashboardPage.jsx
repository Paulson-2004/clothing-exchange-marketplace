import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../api/adminApi';
import StatsCard from '../components/admin/StatsCard';
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

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and quick links</p>
      </div>

      {/* Users */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>👥 Users</h2>
          <Link to="/admin/users" className="btn btn-secondary btn-sm">
            Manage Users →
          </Link>
        </div>
        <div className="stats-grid">
          <StatsCard label="Total Users" value={stats.users.total} icon="👤" />
          <StatsCard label="Admins" value={stats.users.admins} icon="🛡️" />
        </div>
      </div>

      {/* Listings */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>👕 Listings</h2>
          <Link to="/admin/listings" className="btn btn-secondary btn-sm">
            Manage Listings →
          </Link>
        </div>
        <div className="stats-grid">
          <StatsCard label="Total Listings" value={stats.listings.total} icon="📦" />
          <StatsCard label="Available" value={stats.listings.available} icon="✅" />
          <StatsCard label="Pending" value={stats.listings.pending} icon="⏳" />
          <StatsCard label="Swapped" value={stats.listings.swapped} icon="🔄" />
        </div>
      </div>

      {/* Swaps */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>🤝 Swap Requests</h2>
          <Link to="/admin/swaps" className="btn btn-secondary btn-sm">
            View All Swaps →
          </Link>
        </div>
        <div className="stats-grid">
          <StatsCard label="Total Swaps" value={stats.swaps.total} icon="📊" />
          <StatsCard label="Pending" value={stats.swaps.pending} icon="⏳" />
          <StatsCard label="Accepted" value={stats.swaps.accepted} icon="✅" />
          <StatsCard label="Completed" value={stats.swaps.completed} icon="🎉" />
          <StatsCard label="Rejected" value={stats.swaps.rejected} icon="❌" />
          <StatsCard label="Cancelled" value={stats.swaps.cancelled} icon="🚫" />
        </div>
      </div>

      {/* Messages */}
      <div className="admin-section">
        <h2>💬 Messages</h2>
        <div className="stats-grid">
          <StatsCard label="Total Messages" value={stats.messages.total} icon="📨" />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
