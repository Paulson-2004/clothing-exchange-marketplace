import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyListings, deleteListing } from '../api/listingApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;

    setDeletingId(id);
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((listing) => listing._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete this listing.');
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading') return <Loader message="Loading your listings…" />;
  if (status === 'error') {
    return <ErrorMessage message="Could not load your listings." onRetry={fetchMyListings} />;
  }

  return (
    <div className="page-container">
      <div className="marketplace-header">
        <h1>My Listings</h1>
        <Link to="/listings/new" className="btn btn-primary">
          + Create Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="You haven't listed anything yet"
          message="Create your first listing to start swapping clothes."
          actionLabel="Create Listing"
          onAction={() => (window.location.href = '/listings/new')}
        />
      ) : (
        <div className="my-listings-table">
          {listings.map((listing) => (
            <div key={listing._id} className="my-listing-row">
              <img
                src={listing.images?.[0] || ''}
                alt={listing.title}
                className="my-listing-thumb"
              />
              <div className="my-listing-info">
                <Link to={`/listings/${listing._id}`}>
                  <strong>{listing.title}</strong>
                </Link>
                <p className={`listing-status listing-status-${listing.status}`}>{listing.status}</p>
              </div>
              <div className="my-listing-actions">
                <Link to={`/listings/${listing._id}/edit`} className="btn btn-secondary">
                  Edit
                </Link>
                <button
                  className="btn btn-secondary btn-danger"
                  onClick={() => handleDelete(listing._id)}
                  disabled={deletingId === listing._id}
                >
                  {deletingId === listing._id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListingsPage;
