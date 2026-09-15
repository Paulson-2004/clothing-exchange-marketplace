import { useState, useEffect } from 'react';
import { getMyListings } from '../../api/listingApi';
import { createSwapRequest } from '../../api/swapApi';
import { compareValues } from '../../utils/valueComparator';
import { formatCurrency } from '../../utils/currency';
import Loader from '../common/Loader';
import { getOptimizedImageUrl } from '../../utils/imageUrl';

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
        setMyListings(data.listings);
        setStatus('ready');
      } catch (err) {
        setStatus('error');
      }
    };
    fetchMyListings();
  }, []);

  const selectedListing = myListings.find((listing) => listing._id === selectedId);
  
  // We use the shared frontend comparator utility to calculate the fairness tier
  // instantly in the browser without making an extra API call, since we already
  // downloaded the estimated values for both listings.
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
      // Wait a moment before closing the modal so the user actually sees the "success" message.
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

          <div className="swap-offer-grid">
            {myListings.map((listing) => {
              const isAvailable = listing.status === 'available';
              const isSelected = selectedId === listing._id;
              return (
                <label
                  key={listing._id}
                  className={`swap-offer-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="offeredListing"
                    value={listing._id}
                    checked={isSelected}
                    disabled={!isAvailable}
                    onChange={() => setSelectedId(listing._id)}
                    className="visually-hidden"
                  />
                  <div className="swap-offer-image-wrap">
                    <img
                      src={getOptimizedImageUrl(listing.images?.[0], { width: 300, height: 400 }) || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'}
                      alt={listing.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    {!isAvailable && (
                      <div className="swap-offer-overlay">
                        {listing.status === 'pending' ? 'Pending Swap' : 'Swapped'}
                      </div>
                    )}
                  </div>
                  <div className="swap-offer-details">
                    <p className="swap-offer-brand">{listing.brand}</p>
                    <p className="swap-offer-title">{listing.title}</p>
                    <p className="swap-offer-value">Est. {formatCurrency(listing.estimatedValue)}</p>
                  </div>
                </label>
              );
            })}
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
