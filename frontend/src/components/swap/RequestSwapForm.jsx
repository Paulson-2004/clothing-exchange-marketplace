import { useState, useEffect } from 'react';
import { getMyListings } from '../../api/listingApi';
import { createSwapRequest } from '../../api/swapApi';
import { compareValues } from '../../utils/valueComparator';
import { formatCurrency } from '../../utils/currency';
import Loader from '../common/Loader';

function RequestSwapForm({ requestedListing, onClose, onSuccess }) {
  const [myListings, setMyListings] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [selectedId, setSelectedId] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const data = await getMyListings();
        // Only listings that are actually available can be offered.
        setMyListings(data.listings.filter((listing) => listing.status === 'available'));
        setStatus('ready');
      } catch (err) {
        setStatus('error');
      }
    };
    fetchMyListings();
  }, []);

  const selectedListing = myListings.find((listing) => listing._id === selectedId);
  // Phase 6: use the shared comparator utility instead of a raw subtraction.
  const comparison = selectedListing
    ? compareValues(requestedListing.estimatedValue, selectedListing.estimatedValue)
    : null;

  const handleSubmit = async () => {
    if (!selectedId) {
      setError('Select one of your listings to offer first');
      return;
    }
    setError('');
    setSubmitState('submitting');
    try {
      await createSwapRequest({ requestedListingId: requestedListing._id, offeredListingId: selectedId });
      setSubmitState('success');
      setTimeout(() => onSuccess(), 900);
    } catch (err) {
      setSubmitState('error');
      setError(err.response?.data?.message || 'Could not create the swap request. Please try again.');
    }
  };

  return (
    <div className="swap-request-form">
      <div className="swap-request-form-header">
        <h3>Request a Swap</h3>
        <button className="swap-close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {status === 'loading' && <Loader message="Loading your listings…" />}

      {status === 'error' && <p className="form-error">Could not load your listings.</p>}

      {status === 'ready' && myListings.length === 0 && (
        <p className="form-error">You don&apos;t have any available listings to offer. Create one first.</p>
      )}

      {status === 'ready' && myListings.length > 0 && (
        <>
          <p className="field-hint">Choose one of your available listings to offer in exchange:</p>

          <div className="swap-offer-options">
            {myListings.map((listing) => (
              <label
                key={listing._id}
                className={`swap-offer-option ${selectedId === listing._id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="offeredListing"
                  value={listing._id}
                  checked={selectedId === listing._id}
                  onChange={() => setSelectedId(listing._id)}
                />
                <img
                  src={listing.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'}
                  alt={listing.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div>
                  <p className="swap-mini-title">{listing.title}</p>
                  <p className="swap-mini-value">Est. {formatCurrency(listing.estimatedValue)}</p>
                </div>
              </label>
            ))}
          </div>

          {comparison && (
            <div className="swap-value-preview">
              <p>
                <strong>Requested item:</strong> {requestedListing.title} — Est. {formatCurrency(comparison.valueA)}
              </p>
              <p>
                <strong>Your offer:</strong> {selectedListing.title} — Est. {formatCurrency(comparison.valueB)}
              </p>
              <p className="swap-value-diff">
                {comparison.absoluteDifference === 0
                  ? 'Even estimated value'
                  : `Difference: ${formatCurrency(comparison.absoluteDifference)} (${comparison.percentageDifference}%)`}
                {' · '}
                <strong>{comparison.classification}</strong>
              </p>
              <p className="field-hint">
                Estimated values are for barter comparison only. This is a direct item-for-item exchange with no cash payments. Both users decide whether the trade is agreeable.
              </p>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          {submitState === 'success' && <p className="form-success">Swap request sent!</p>}

          <div className="swap-request-form-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={submitState === 'submitting'}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selectedId || submitState === 'submitting'}
            >
              {submitState === 'submitting' ? 'Sending…' : 'Confirm Swap Request'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default RequestSwapForm;
