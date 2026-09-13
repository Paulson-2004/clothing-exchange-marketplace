import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListingById, getListingMatches } from '../api/listingApi';
import { createOrFindConversation } from '../api/chatApi';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import Icon from '../components/common/Icon';
import ListingCard from '../components/listing/ListingCard';
import RequestSwapForm from '../components/swap/RequestSwapForm';
import { formatCurrency } from '../utils/currency';

const STATUS_LABELS = {
  available: 'Available',
  pending: 'Pending Swap',
  swapped: 'Swapped',
};

function ItemDetailsPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'notfound'
  const [activeImage, setActiveImage] = useState(0);
  const [showSwapForm, setShowSwapForm] = useState(false);

  // Phase 7: Nearby swap matches
  const [matches, setMatches] = useState([]);
  const [matchesStatus, setMatchesStatus] = useState('idle'); // 'idle' | 'loading' | 'loaded' | 'error'

  useEffect(() => {
    const fetchListing = async () => {
      setStatus('loading');
      setMatches([]);
      setMatchesStatus('idle');
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

  // Fetch matches once listing loads and is available
  useEffect(() => {
    if (!listing || listing.status !== 'available') return;

    const fetchMatches = async () => {
      setMatchesStatus('loading');
      try {
        const data = await getListingMatches(listing._id);
        setMatches(data.matches || []);
        setMatchesStatus('loaded');
      } catch {
        setMatchesStatus('error');
      }
    };
    fetchMatches();
  }, [listing]);

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

  const handleMessageOwner = async () => {
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
            <img
              src={listing.images[activeImage]}
              alt={listing.title}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
              }}
            />
          ) : (
            <div className="item-details-image-placeholder">No image available</div>
          )}
        </div>

        {listing.images && listing.images.length > 1 && (
          <div className="item-details-thumbnails">
            {listing.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`thumbnail-btn ${activeImage === idx ? 'active' : ''}`}
                onClick={() => setActiveImage(idx)}
              >
                <img
                  src={img}
                  alt={`${listing.title} view ${idx + 1}`}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="item-details-info">
        <div className="item-details-header">
          <h1>{listing.title}</h1>
          <span className={`listing-status listing-status-${listing.status}`}>
            {STATUS_LABELS[listing.status] || listing.status}
          </span>
        </div>

        <div className="item-specs-grid" aria-label="Item specifications">
          <span className="spec-chip spec-chip-category">
            <span className="spec-chip-label">Category:</span>
            <span className="spec-chip-value">{listing.category}</span>
          </span>
          <span className="spec-chip spec-chip-brand">
            <span className="spec-chip-label">Brand:</span>
            <span className="spec-chip-value">{listing.brand}</span>
          </span>
          <span className="spec-chip spec-chip-size">
            <span className="spec-chip-label">Size:</span>
            <span className="spec-chip-value">{listing.size}</span>
          </span>
          <span className="spec-chip spec-chip-condition">
            <span className="spec-chip-label">Condition:</span>
            <span className="spec-chip-value">{listing.condition}</span>
          </span>
        </div>

        <dl className="item-details-list">
          <dt>Estimated swap value</dt>
          <dd>
            <strong>{formatCurrency(listing.estimatedValue)}</strong>{' '}
            <span className="field-hint">(estimate only — for barter comparison, not a cash price)</span>
          </dd>
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
            <button className="btn btn-secondary" onClick={handleMessageOwner}>
              Message Owner
            </button>
          </div>
        ) : (
          <div className="item-details-action-row">
            <button className="btn btn-primary" onClick={() => setShowSwapForm(true)}>
              Request Swap
            </button>
            <button className="btn btn-secondary" onClick={handleMessageOwner}>
              Message Owner
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

      {/* Phase 7: Nearby Swap Matches */}
      {listing.status === 'available' && (
        <div className="matches-section">
          <h2>Nearby Swap Matches</h2>
          <p className="matches-subtitle">
            Items in the same area with a compatible estimated value
          </p>

          {matchesStatus === 'loading' && <Loader message="Finding nearby matches…" />}

          {matchesStatus === 'error' && (
            <ErrorMessage
              message="Could not load nearby matches."
              onRetry={() => {
                setMatchesStatus('idle');
                // Re-trigger effect by updating listing reference
                setListing((prev) => ({ ...prev }));
              }}
            />
          )}

          {matchesStatus === 'loaded' && matches.length === 0 && (
            <EmptyState
              title="No nearby matches"
              message="There are no items with a compatible value in the same area right now. Check back later!"
            />
          )}

          {matchesStatus === 'loaded' && matches.length > 0 && (
            <div className="matches-grid">
              {matches.map(({ listing: matchListing, matchDetails }) => (
                <div key={matchListing._id} className="match-card-wrapper">
                  <ListingCard listing={matchListing} />
                  <div className="match-reason">
                    <span className={`match-tag match-tag-${matchDetails.locationTier}`}>
                      <Icon name="location" size={13} /> {matchDetails.locationLabel}
                    </span>
                    <span className={`match-tag match-tag-value-${matchDetails.valueComparison.classification === 'Close Match' ? 'close' : 'moderate'}`}>
                      <Icon name="value" size={13} /> {matchDetails.valueComparison.classification}
                      {matchDetails.valueComparison.absoluteDifference > 0
                        ? ` (${formatCurrency(matchDetails.valueComparison.absoluteDifference)} · ${matchDetails.valueComparison.percentageDifference}%)`
                        : ' (even value)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ItemDetailsPage;
