import { Link, useNavigate } from 'react-router-dom';
import { createOrFindConversation } from '../../api/chatApi';
import { compareValues } from '../../utils/valueComparator';
import { formatCurrency } from '../../utils/currency';
import { getOptimizedImageUrl } from '../../utils/imageUrl';
import Icon from '../common/Icon';

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Declined',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function EditorialMiniListing({ listing, label, isMine }) {
  if (!listing) {
    return (
      <div className="editorial-swap-side">
        <h4 className="swap-side-label">{label}</h4>
        <div className="swap-side-missing">Item no longer available</div>
      </div>
    );
  }

  return (
    <div className="editorial-swap-side">
      <h4 className="swap-side-label">{label}</h4>
      <Link to={`/listings/${listing._id}`} className="swap-side-link">
        <div className="swap-side-image-wrapper">
          <img
            src={getOptimizedImageUrl(listing.images?.[0], { width: 300, height: 400 }) || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'}
            alt={listing.title}
            className="swap-side-image"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </div>
        <div className="swap-side-details">
          <p className="swap-side-brand">{listing.brand}</p>
          <p className="swap-side-title">{listing.title}</p>
          <p className="swap-side-meta">{listing.size} · {listing.condition}</p>
          <p className="swap-side-value">Est. Value: {formatCurrency(listing.estimatedValue)}</p>
        </div>
      </Link>
    </div>
  );
}

function SwapRequestCard({ swapRequest, variant, onAccept, onReject, onCancel, onComplete, busy }) {
  const { _id, requester, requestedListing, offeredListing, status, createdAt } = swapRequest;
  const navigate = useNavigate();

  const comparison =
    requestedListing && offeredListing
      ? compareValues(requestedListing.estimatedValue, offeredListing.estimatedValue)
      : null;

  const otherUserId = variant === 'incoming' ? requester?._id : requestedListing?.owner?._id;
  const otherUserName = variant === 'incoming' ? requester?.name : requestedListing?.owner?.name;

  const handleOpenNegotiation = async () => {
    if (!otherUserId) return;
    try {
      const data = await createOrFindConversation({ otherUserId, swapRequestId: _id });
      navigate(`/chat?conversation=${data.conversation._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not open the conversation. Please try again.');
    }
  };

  const myListing = variant === 'incoming' ? requestedListing : offeredListing;
  const theirListing = variant === 'incoming' ? offeredListing : requestedListing;

  return (
    <div className="editorial-swap-card">
      <div className="editorial-swap-header">
        <div className="swap-header-info">
          <span className={`swap-status-badge swap-status-${status}`}>
            {STATUS_LABELS[status] || status}
          </span>
          <span className="swap-date">{new Date(createdAt).toLocaleDateString()}</span>
        </div>
        <h3 className="swap-context-title">
          {variant === 'incoming' 
            ? <>{otherUserName || 'A user'} wants to swap with you</>
            : <>You requested a swap from {otherUserName || 'a user'}</>}
        </h3>
      </div>

      <div className="editorial-swap-body">
        <EditorialMiniListing listing={myListing} label="Your Item" isMine={true} />
        
        <div className="swap-exchange-divider">
          <div className="swap-exchange-icon">
            <Icon name="swap" size={24} />
          </div>
        </div>
        
        <EditorialMiniListing listing={theirListing} label={variant === 'incoming' ? "Their Offer" : "Requested Item"} isMine={false} />
      </div>

      {comparison !== null && (
        <div className="editorial-swap-value-box">
          <h4 className="value-box-title">Value Comparison</h4>
          <div className="value-box-content">
            <span className="value-box-diff">
              {comparison.absoluteDifference === 0
                ? 'Even value exchange'
                : `Difference: ${formatCurrency(comparison.absoluteDifference)}`}
            </span>
            <span className={`value-box-badge value-match-${comparison.classification === 'Close Match' ? 'close' : comparison.classification === 'Moderate Difference' ? 'moderate' : 'large'}`}>
              {comparison.classification} ({comparison.percentageDifference}%)
            </span>
          </div>
        </div>
      )}

      <div className="editorial-swap-actions">
        {otherUserId && (
          <button className="btn btn-secondary btn-negotiate" onClick={handleOpenNegotiation} disabled={busy}>
            Message / Negotiate
          </button>
        )}

        {variant === 'incoming' && status === 'pending' && (
          <div className="action-group">
            <button className="btn btn-secondary" onClick={() => onReject(_id)} disabled={busy}>
              Decline
            </button>
            <button className="btn btn-primary" onClick={() => onAccept(_id)} disabled={busy}>
              Accept Swap
            </button>
          </div>
        )}

        {variant === 'sent' && status === 'pending' && (
          <div className="action-group">
            <button className="btn btn-secondary" onClick={() => onCancel(_id)} disabled={busy}>
              Cancel Request
            </button>
          </div>
        )}

        {status === 'accepted' && (
          <div className="action-group">
            <button className="btn btn-primary" onClick={() => onComplete(_id)} disabled={busy}>
              Mark Swap Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwapRequestCard;
