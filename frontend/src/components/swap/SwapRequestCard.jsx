import { Link, useNavigate } from 'react-router-dom';
import { createOrFindConversation } from '../../api/chatApi';

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
          src={listing.images?.[0] || ''}
          alt={listing.title}
          className="swap-mini-image"
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

  const valueDifference =
    requestedListing && offeredListing ? offeredListing.estimatedValue - requestedListing.estimatedValue : null;

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

      {valueDifference !== null && (
        <p className="swap-value-diff">
          Requested item: ${requestedListing.estimatedValue} • Offered item: ${offeredListing.estimatedValue} •{' '}
          {valueDifference === 0 ? 'Even value' : `Difference: $${Math.abs(valueDifference)}`}
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
