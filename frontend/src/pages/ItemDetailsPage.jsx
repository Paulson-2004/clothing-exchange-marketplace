import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListingById } from '../api/listingApi';
import { createOrFindConversation } from '../api/chatApi';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import RequestSwapForm from '../components/swap/RequestSwapForm';

function ItemDetailsPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'notfound'
  const [activeImage, setActiveImage] = useState(0);
  const [showSwapForm, setShowSwapForm] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      setStatus('loading');
      try {
        const data = await getListingById(id);
        setListing(data.listing);
        setActiveImage(0);
        setStatus('success');
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 400) {
          setStatus('notfound');
        } else {
          setStatus('error');
        }
      }
    };
    fetchListing();
  }, [id]);

  if (status === 'loading') return <Loader message="Loading item…" />;
  if (status === 'notfound') {
    return (
      <div className="page-container">
        <ErrorMessage message="This listing doesn't exist or may have been removed." />
        <Link to="/">Back to marketplace</Link>
      </div>
    );
  }
  if (status === 'error') {
    return <ErrorMessage message="Something went wrong loading this listing." />;
  }

  const isOwner = user && listing.owner?._id === user.id;

  const handleMessageSeller = async () => {
    try {
      const data = await createOrFindConversation({ otherUserId: listing.owner._id });
      navigate(`/chat?conversation=${data.conversation._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not open the conversation. Please try again.');
    }
  };

  return (
    <div className="page-container item-details-page">
      <div className="item-details-images">
        <div className="item-details-main-image">
          {listing.images && listing.images.length > 0 ? (
            <img src={listing.images[activeImage]} alt={listing.title} />
          ) : (
            <div className="listing-card-image-placeholder">No Image</div>
          )}
        </div>
        {listing.images && listing.images.length > 1 && (
          <div className="item-details-thumbnails">
            {listing.images.map((url, index) => (
              <img
                key={url}
                src={url}
                alt={`${listing.title} thumbnail ${index + 1}`}
                className={index === activeImage ? 'active' : ''}
                onClick={() => setActiveImage(index)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="item-details-info">
        <h1>{listing.title}</h1>
        <p className={`listing-status listing-status-${listing.status}`}>
          {listing.status === 'available' ? 'Available' : listing.status === 'pending' ? 'Pending Swap' : 'Swapped'}
        </p>

        <dl className="item-details-list">
          <dt>Category</dt>
          <dd>{listing.category}</dd>
          <dt>Brand</dt>
          <dd>{listing.brand}</dd>
          <dt>Size</dt>
          <dd>{listing.size}</dd>
          <dt>Condition</dt>
          <dd>{listing.condition}</dd>
          <dt>Estimated swap value</dt>
          <dd>${listing.estimatedValue} (estimate only, not a market price)</dd>
          <dt>Location</dt>
          <dd>
            {listing.location?.city || listing.location?.state
              ? `${listing.location.city}${listing.location.city && listing.location.state ? ', ' : ''}${listing.location.state}`
              : 'Not specified'}
          </dd>
          <dt>Listed by</dt>
          <dd>{listing.owner?.name || 'Unknown user'}</dd>
        </dl>

        <h3>Description</h3>
        <p className="item-details-description">{listing.description}</p>

        {isOwner ? (
          <div className="item-details-owner-actions">
            <Link to={`/listings/${listing._id}/edit`} className="btn btn-primary">
              Edit Listing
            </Link>
          </div>
        ) : !isAuthenticated ? (
          <button className="btn btn-primary" onClick={() => navigate('/login', { state: { from: { pathname: `/listings/${id}` } } })}>
            Log In to Request Swap
          </button>
        ) : listing.status !== 'available' ? (
          <div className="item-details-action-row">
            <button className="btn btn-primary" disabled title="This item is not currently available">
              Not Available
            </button>
            <button className="btn btn-secondary" onClick={handleMessageSeller}>
              Message Seller
            </button>
          </div>
        ) : (
          <div className="item-details-action-row">
            <button className="btn btn-primary" onClick={() => setShowSwapForm(true)}>
              Request Swap
            </button>
            <button className="btn btn-secondary" onClick={handleMessageSeller}>
              Message Seller
            </button>
          </div>
        )}

        {showSwapForm && (
          <RequestSwapForm
            requestedListing={listing}
            onClose={() => setShowSwapForm(false)}
            onSuccess={() => navigate('/swap-requests')}
          />
        )}
      </div>
    </div>
  );
}

export default ItemDetailsPage;
