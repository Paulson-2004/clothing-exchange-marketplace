import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminUserById } from '../api/adminApi';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminUserById(id);
      setUser(data.user);
      setActivity(data.activity);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Loader message="Loading user details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchUser} />;
  if (!user) return null;

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>User Details</h1>
        <Link to="/admin/users" className="btn btn-secondary btn-sm">← Back to Users</Link>
      </div>

      <div className="admin-detail-card">
        <h2>{user.name}</h2>
        <div className="admin-detail-grid">
          <div className="admin-detail-item">
            <span className="admin-detail-label">Email</span>
            <span className="admin-detail-value">{user.email}</span>
          </div>
          <div className="admin-detail-item">
            <span className="admin-detail-label">Role</span>
            <span className={`admin-badge admin-badge-${user.role}`}>{user.role}</span>
          </div>
          <div className="admin-detail-item">
            <span className="admin-detail-label">Joined</span>
            <span className="admin-detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          {user.location && (user.location.city || user.location.state || user.location.country) && (
            <div className="admin-detail-item">
              <span className="admin-detail-label">Location</span>
              <span className="admin-detail-value">
                {[user.location.city, user.location.state, user.location.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="admin-section">
        <h2>Activity Summary</h2>
        <div className="stats-grid">
          <div className="stats-card">
            <span className="stats-card-icon">👕</span>
            <div className="stats-card-content">
              <span className="stats-card-value">{activity.listingCount}</span>
              <span className="stats-card-label">Listings Created</span>
            </div>
          </div>
          <div className="stats-card">
            <span className="stats-card-icon">🤝</span>
            <div className="stats-card-content">
              <span className="stats-card-value">{activity.swapCount}</span>
              <span className="stats-card-label">Swap Requests Sent</span>
            </div>
          </div>
          <div className="stats-card">
            <span className="stats-card-icon">💬</span>
            <div className="stats-card-content">
              <span className="stats-card-value">{activity.messageCount}</span>
              <span className="stats-card-label">Messages Sent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailPage;
