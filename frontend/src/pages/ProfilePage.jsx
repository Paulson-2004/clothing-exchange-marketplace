import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../api/authApi';
import { getMyListings } from '../api/listingApi';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import ListingCard from '../components/listing/ListingCard';

function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [myListings, setMyListings] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('profile'); // 'profile', 'edit'

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteDeleting, setDeleteDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchProfileAndListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pData, lData] = await Promise.all([
        getProfile(),
        getMyListings()
      ]);
      setProfileData(pData);
      setMyListings(lData.listings || []);
      setFormData({
        name: pData.user.name || '',
        phone: pData.user.phone || '',
        bio: pData.user.bio || '',
        city: pData.user.location?.city || '',
        state: pData.user.location?.state || '',
        country: pData.user.location?.country || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndListings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
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
      setViewMode('profile');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        updateUser(null);
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Current password is required to delete your account.');
      return;
    }
    setDeleteDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
      updateUser(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
      setDeleteDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorMessage message={error} onRetry={fetchProfileAndListings} />
      </div>
    );
  }

  const user = profileData?.user || authUser;
  
  // Format location string cleanly
  const locParts = [user.location?.city, user.location?.state, user.location?.country].filter(Boolean);
  const locationString = locParts.length > 0 ? locParts.join(', ') : 'Location not specified';

  return (
    <div className="page-container editorial-profile-page">
      {saveSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
          Profile updated successfully!
        </div>
      )}

      {viewMode === 'edit' ? (
        <div className="editorial-profile-edit">
          <div className="editorial-edit-header">
            <h1 className="editorial-title">Edit Profile</h1>
            <p className="editorial-subtitle">Update your personal information and location.</p>
          </div>

          {saveError && <ErrorMessage message={saveError} />}

          <form onSubmit={handleProfileSubmit} className="editorial-form profile-edit-form">
            <div className="form-row-editorial">
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
                <label htmlFor="phone">Phone / Contact</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">About / Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                placeholder="Share your swap preferences, favourite styles, or sizing notes..."
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={300}
              />
              <small className="form-help-text">{formData.bio.length} / 300 characters</small>
            </div>

            <h3 className="editorial-section-label" style={{ marginTop: '2.5rem', marginBottom: '1.5rem' }}>Location</h3>
            <div className="form-row-editorial">
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

            <div className="form-actions-editorial" style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setViewMode('profile'); setSaveError(null); }} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>

          {/* Account Settings Section */}
          <div style={{ marginTop: '5rem' }}>
            <h2 className="editorial-section-title" style={{ marginBottom: '2rem' }}>Account Settings</h2>
            
            <div style={{ marginBottom: '4rem' }}>
              <h3 className="editorial-section-label" style={{ marginBottom: '1.5rem' }}>Change Password</h3>
              {passwordSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                  Password updated successfully! You will be logged out momentarily.
                </div>
              )}
              {passwordError && <ErrorMessage message={passwordError} />}
              <form onSubmit={handlePasswordSubmit} className="editorial-form">
                <div className="form-row-editorial">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-secondary" disabled={passwordSaving}>
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '3rem' }}>
              <h3 className="editorial-section-label" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Danger Zone</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '600px', lineHeight: '1.6' }}>
                Deleting your account is permanent. Your active listings and pending swap requests will be cancelled. Your completed swaps and chat history will be anonymized to preserve marketplace records.
              </p>
              
              {deleteError && <ErrorMessage message={deleteError} />}
              
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              ) : (
                <div className="alert alert-warning" style={{ backgroundColor: 'transparent', border: '1px solid var(--color-danger)', padding: '2rem' }}>
                  <p style={{ color: 'var(--color-danger)', fontWeight: '500', marginBottom: '1.5rem' }}>
                    Are you absolutely sure you want to delete your account? This action cannot be undone.
                  </p>
                  <div className="form-group" style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
                    <label htmlFor="deletePassword">Confirm your current password</label>
                    <input
                      id="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="form-actions-editorial">
                    <button
                      type="button"
                      className="btn btn-primary btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={deleteDeleting || !deletePassword}
                    >
                      {deleteDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword('');
                        setDeleteError(null);
                      }}
                      disabled={deleteDeleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="editorial-profile-view">
          <div className="editorial-profile-header">
            <div className="profile-header-top">
              <div className="profile-avatar-giant">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="profile-header-text">
                <h1 className="profile-name">{user.name}</h1>
                <p className="profile-location">{locationString}</p>
                {user.bio && <p className="profile-bio">{user.bio}</p>}
                <p className="profile-member-since">Member since {new Date(user.createdAt).getFullYear()}</p>
              </div>
              <div className="profile-header-actions">
                <button className="btn btn-secondary" onClick={() => setViewMode('edit')}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="editorial-profile-wardrobe">
            <div className="wardrobe-header">
              <h2 className="editorial-section-title">My Wardrobe</h2>
            </div>
            
            {myListings.length === 0 ? (
              <div className="empty-state editorial-empty-state">
                <h3>Your wardrobe is empty</h3>
                <p>List your first piece on ReWear and give it a second life.</p>
                <Link to="/listings/new" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                  List an Item
                </Link>
              </div>
            ) : (
              <div className="listing-grid">
                {myListings.map(listing => (
                  <div key={listing._id} className="wardrobe-item-wrapper">
                    <ListingCard listing={listing} />
                    {listing.status !== 'available' && (
                      <div className="wardrobe-item-mask">
                        <span className="wardrobe-item-mask-text">
                          {listing.status === 'pending' ? 'Pending Swap' : 'Swapped'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
