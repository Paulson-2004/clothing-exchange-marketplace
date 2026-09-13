import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyListings, deleteListing } from '../api/listingApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import ConfirmModal from '../components/common/ConfirmModal';
import { getOptimizedImageUrl } from '../utils/imageUrl';
import { formatCurrency } from '../utils/currency';

function MyListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [deletingListing, setDeletingListing] = useState(null);

  const fetchMyListings = async () => {
    setStatus('loading');
    try {
      const data = await getMyListings();
      setListings(data.listings);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingListing) return;
    try {
      await deleteListing(deletingListing._id);
      setListings((prev) => prev.filter((l) => l._id !== deletingListing._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete this listing.');
    } finally {
      setDeletingListing(null);
    }
  };

  if (status === 'loading') return <Loader message="Loading your wardrobe…" />;
  if (status === 'error') {
    return <ErrorMessage message="Could not load your listings." onRetry={fetchMyListings} />;
  }

  return (
    <div className="page-container admin-page-wide">
      <div className="marketplace-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>My Account</div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>
            My Listings
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '1.05rem' }}>
            Manage your ReWear wardrobe inventory.
          </p>
        </div>
        <Link to="/listings/new" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}>+ Add to Wardrobe</Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="Your wardrobe is empty"
          message="Create your first listing to start exchanging with the ReWear community."
          actionLabel="Create Listing"
          onAction={() => navigate('/listings/new')}
        />
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0' }}>
          <table className="wardrobe-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Item</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '15%' }}>Est. Value</th>
                <th style={{ width: '15%' }}>Listed On</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing._id}>
                  <td>
                    <div className="wardrobe-item-cell">
                      {listing.images?.[0] ? (
                        <img
                          src={getOptimizedImageUrl(listing.images[0], { width: 120, height: 160 })}
                          alt={listing.title}
                          className="wardrobe-item-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      ) : (
                        <div className="wardrobe-item-thumb" />
                      )}
                      <div className="wardrobe-item-meta">
                        <Link to={`/listings/${listing._id}`} className="wardrobe-item-title">
                          {listing.title}
                        </Link>
                        <div className="wardrobe-item-details">
                          {listing.brand} &middot; {listing.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span className={`admin-role-badge ${listing.status}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle', fontWeight: 500 }}>
                    {formatCurrency(listing.estimatedValue)}
                  </td>
                  <td style={{ verticalAlign: 'middle', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div className="wardrobe-actions">
                      <Link to={`/listings/${listing._id}/edit`} className="wardrobe-action-link">
                        Edit
                      </Link>
                      <button
                        className="wardrobe-action-link danger"
                        onClick={() => setDeletingListing(listing)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deletingListing && (
        <ConfirmModal
          title="Delete Listing"
          message={`Are you sure you want to permanently delete "${deletingListing.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingListing(null)}
        />
      )}
    </div>
  );
}

export default MyListingsPage;
