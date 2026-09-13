import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    country: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfileData(data);
      setFormData({
        name: data.user.name || '',
        phone: data.user.phone || '',
        bio: data.user.bio || '',
        city: data.user.location?.city || '',
        state: data.user.location?.state || '',
        country: data.user.location?.country || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        location: {
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
        },
      });
      setProfileData((prev) => ({ ...prev, user: res.user }));
      updateUser(res.user);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Loading profile…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorMessage message={error} onRetry={fetchProfile} />
      </div>
    );
  }

  const user = profileData?.user || authUser;
  const activity = profileData?.activity || {};
  const recentSwaps = profileData?.recentSwaps || [];

  return (
    <div className="page-container profile-page">
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-header-info">
          <div className="profile-title-row">
            <h1>{user.name}</h1>
            <span className={`badge badge-${user.role === 'admin' ? 'admin' : 'user'}`}>
              {user.role === 'admin' ? 'Administrator' : 'Member'}
            </span>
          </div>
          <p className="profile-email">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="profile-joined">
            <strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="profile-header-actions">
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setIsEditing(true);
                setSaveError(null);
              }}
            >
              Edit Profile
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setSaveError(null);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          Profile updated successfully!
        </div>
      )}

      {isEditing ? (
        <div className="profile-card">
          <h2>Edit Personal Information</h2>
          {saveError && <ErrorMessage message={saveError} />}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength={80}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address (Read-only)</label>
              <input id="email" type="email" value={user.email} disabled className="input-disabled" />
              <small className="form-help-text">Email address cannot be modified.</small>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone / Contact Number</label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">About / Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows="3"
                placeholder="Share your swap preferences, favourite styles, or sizing notes…"
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={300}
              />
              <small className="form-help-text">{formData.bio.length} / 300 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Bengaluru"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State / Region</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="e.g. Karnataka"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="profile-details-grid">
            <div className="profile-card">
              <h2>Contact & Location</h2>
              <ul className="profile-info-list">
                <li>
                  <span className="profile-info-label">Phone:</span>
                  <span className="profile-info-value">{user.phone || 'Not provided'}</span>
                </li>
                <li>
                  <span className="profile-info-label">Location:</span>
                  <span className="profile-info-value">
                    {user.location?.city || user.location?.state || user.location?.country ? (
                      [user.location.city, user.location.state, user.location.country]
                        .filter(Boolean)
                        .join(', ')
                    ) : (
                      'Not provided'
                    )}
                  </span>
                </li>
                <li>
                  <span className="profile-info-label">Bio:</span>
                  <span className="profile-info-value">{user.bio || 'No bio provided yet.'}</span>
                </li>
              </ul>
            </div>

            <div className="profile-card">
              <h2>Activity Overview</h2>
              <div className="profile-stats-grid">
                <div className="profile-stat-box">
                  <span className="stat-number">{activity.totalListings ?? 0}</span>
                  <span className="stat-label">Total Listings</span>
                </div>
                <div className="profile-stat-box">
                  <span className="stat-number">{activity.availableListings ?? 0}</span>
                  <span className="stat-label">Available Items</span>
                </div>
                <div className="profile-stat-box">
                  <span className="stat-number">{activity.swappedListings ?? 0}</span>
                  <span className="stat-label">Swapped Items</span>
                </div>
                <div className="profile-stat-box">
                  <span className="stat-number">{activity.completedSwaps ?? 0}</span>
                  <span className="stat-label">Completed Swaps</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-card" style={{ marginTop: '1.5rem' }}>
            <div className="profile-card-header">
              <h2>Recent Swap History</h2>
              <Link to="/swap-requests" className="btn btn-secondary btn-sm">
                View All Swap Requests →
              </Link>
            </div>

            {recentSwaps.length === 0 ? (
              <p className="empty-text">No swap requests yet. Browse the marketplace to start swapping!</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Requested Item</th>
                      <th>Offered Item</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSwaps.map((swap) => {
                      const isOutgoing = swap.requester?._id?.toString() === user.id?.toString();
                      return (
                        <tr key={swap._id}>
                          <td>{new Date(swap.updatedAt || swap.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${isOutgoing ? 'badge-user' : 'badge-admin'}`}>
                              {isOutgoing ? 'Sent Request' : 'Incoming Request'}
                            </span>
                          </td>
                          <td>
                            {swap.requestedListing ? (
                              <Link to={`/listings/${swap.requestedListing._id}`}>
                                {swap.requestedListing.title}
                              </Link>
                            ) : (
                              'Deleted Item'
                            )}
                          </td>
                          <td>
                            {swap.offeredListing ? (
                              <Link to={`/listings/${swap.offeredListing._id}`}>
                                {swap.offeredListing.title}
                              </Link>
                            ) : (
                              'Deleted Item'
                            )}
                          </td>
                          <td>
                            <span className={`status-badge status-${swap.status}`}>
                              {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProfilePage;

