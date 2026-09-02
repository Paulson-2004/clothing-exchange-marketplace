import { Link, useNavigate } from 'react-router-dom';
import { createOrFindConversation } from '../../api/chatApi';
import { compareValues } from '../../utils/valueComparator';

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// A small listing preview used twice per card (requested + offered side).
function MiniListing({ listing, label }) {
  if (!listing) {
    return (
      <div className="swap-mini-listing">
        <p className="swap-mini-label">{label}</p>
        <p className="swap-mini-missing">Listing no longer available</p>
      </div>
    );
  }

  return (
    <div className="swap-mini-listing">
      <p className="swap-mini-label">{label}</p>
      <Link to={`/listings/${listing._id}`} className="swap-mini-link">
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'}
          alt={listing.title}
          className="swap-mini-image"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div>
          <p className="swap-mini-title">{listing.title}</p>
          <p className="swap-mini-value">Est. ${listing.estimatedValue}</p>
        </div>
      </Link>
    </div>
  );
}

// `variant` is 'incoming' or 'sent' - controls which action buttons show.
function SwapRequestCard({ swapRequest, variant, onAccept, onReject, onCancel, onComplete, busy }) {
  const { _id, requester, requestedListing, offeredListing, status, createdAt } = swapRequest;
  const navigate = useNavigate();

  // Phase 6: use the shared comparator utility instead of a raw subtraction.
  const comparison =
    requestedListing && offeredListing
      ? compareValues(requestedListing.estimatedValue, offeredListing.estimatedValue)
      : null;

  // The "other" party depends on which side of the exchange we're
  // viewing: for an incoming request it's the requester; for a sent
  // request it's the owner of the item we requested.
  const otherUserId = variant === 'incoming' ? requester?._id : requestedListing?.owner?._id;

  const handleOpenNegotiation = async () => {
    if (!otherUserId) return;
    try {
      const data = await createOrFindConversation({ otherUserId, swapRequestId: _id });
      navigate(`/chat?conversation=${data.conversation._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not open the conversation. Please try again.');
    }
  };

  return (
    <div className="swap-request-card">
      <div className="swap-request-header">
        <span className={`swap-status swap-status-${status}`}>{STATUS_LABELS[status] || status}</span>
        <span className="swap-request-date">{new Date(createdAt).toLocaleDateString()}</span>
      </div>

      <p className="swap-request-people">
        {variant === 'incoming' ? (
          <>
            <strong>{requester?.name || 'A user'}</strong> wants to swap with you
          </>
        ) : (
          <>You requested a swap</>
        )}
      </p>

      <div className="swap-comparison">
        <MiniListing listing={requestedListing} label="They get" />
        <span className="swap-arrow">⇄</span>
        <MiniListing listing={offeredListing} label="You get" />
      </div>

      {comparison !== null && (
        <p className="swap-value-diff">
          Est. ${comparison.valueA} (requested) • Est. ${comparison.valueB} (offered)
          {' • '}
          {comparison.absoluteDifference === 0
            ? 'Even value'
            : `Difference: $${comparison.absoluteDifference} (${comparison.percentageDifference}%)`}
          {' • '}
          <strong>{comparison.classification}</strong>
        </p>
      )}

      <div className="swap-request-actions">
        {otherUserId && (
          <button className="btn btn-secondary" onClick={handleOpenNegotiation} disabled={busy}>
            Open Negotiation
          </button>
        )}

        {variant === 'incoming' && status === 'pending' && (
          <>
            <button className="btn btn-primary" onClick={() => onAccept(_id)} disabled={busy}>
              Accept
            </button>
            <button className="btn btn-secondary btn-danger" onClick={() => onReject(_id)} disabled={busy}>
              Reject
            </button>
          </>
        )}

        {variant === 'sent' && status === 'pending' && (
          <button className="btn btn-secondary btn-danger" onClick={() => onCancel(_id)} disabled={busy}>
            Cancel Request
          </button>
        )}

        {status === 'accepted' && (
          <button className="btn btn-primary" onClick={() => onComplete(_id)} disabled={busy}>
            Mark Swap Complete
          </button>
        )}
      </div>
    </div>
  );
}

export default SwapRequestCard;
