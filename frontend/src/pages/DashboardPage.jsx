import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../api/authApi';
import Loader from '../components/common/Loader';
import Icon from '../components/common/Icon';

function DashboardPage() {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getProfile();
        setProfileData(data);
      } catch (err) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const user = profileData?.user || authUser;
  const activity = profileData?.activity || {};

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-welcome-header">
        <div>
          <h1>Welcome back, {user?.name}!</h1>
          <p className="dashboard-subtitle">
            Manage your sustainable wardrobe, swaps, and profile from one place.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/listings/new" className="btn btn-primary">
            + New Listing
          </Link>
          <Link to="/profile" className="btn btn-secondary">
            View Profile
          </Link>
        </div>
      </div>

      <div className="dashboard-stats-row">
        <div className="dashboard-stat-card">
          <div className="stat-card-number">{activity.totalListings ?? 0}</div>
          <div className="stat-card-title">My Listings</div>
          <Link to="/my-listings" className="stat-card-link">
            Manage listings →
          </Link>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-card-number">{activity.incomingSwaps ?? 0}</div>
          <div className="stat-card-title">Incoming Swaps</div>
          <Link to="/swap-requests" className="stat-card-link">
            View requests →
          </Link>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-card-number">{activity.completedSwaps ?? 0}</div>
          <div className="stat-card-title">Completed Swaps</div>
          <Link to="/swap-requests" className="stat-card-link">
            Swap history →
          </Link>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-card-number">{activity.availableListings ?? 0}</div>
          <div className="stat-card-title">Available for Swap</div>
          <Link to="/" className="stat-card-link">
            Browse market →
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions-list">
            <Link to="/listings/new" className="quick-action-item">
              <span className="quick-action-icon">
                <Icon name="hanger" size={24} />
              </span>
              <div>
                <strong>List an Item</strong>
                <p>Upload a clothing item and get estimated swap value</p>
              </div>
            </Link>

            <Link to="/" className="quick-action-item">
              <span className="quick-action-icon">
                <Icon name="search" size={24} />
              </span>
              <div>
                <strong>Explore Marketplace</strong>
                <p>Discover nearby clothing items to trade</p>
              </div>
            </Link>

            <Link to="/swap-requests" className="quick-action-item">
              <span className="quick-action-icon">
                <Icon name="swap" size={24} />
              </span>
              <div>
                <strong>Manage Swap Requests</strong>
                <p>Review incoming offers and track sent proposals</p>
              </div>
            </Link>

            <Link to="/chat" className="quick-action-item">
              <span className="quick-action-icon">
                <Icon name="chat" size={24} />
              </span>
              <div>
                <strong>Negotiations & Messages</strong>
                <p>Chat directly with swap partners in real time</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Account Summary</h2>
          <div className="profile-info-list" style={{ marginTop: '0.75rem' }}>
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Role:</strong>{' '}
              <span className={`badge badge-${user?.role === 'admin' ? 'admin' : 'user'}`}>
                {user?.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </p>
            <p>
              <strong>Location:</strong>{' '}
              {user?.location?.city || user?.location?.state
                ? `${user?.location?.city || ''}${user?.location?.city && user?.location?.state ? ', ' : ''}${user?.location?.state || ''}`
                : 'Not set'}
            </p>
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/profile" className="btn btn-secondary btn-sm">
              Edit Profile & Location →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
