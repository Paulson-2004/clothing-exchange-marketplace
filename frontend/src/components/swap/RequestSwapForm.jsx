import { useState, useEffect } from 'react';
import { getMyListings } from '../../api/listingApi';
import { createSwapRequest } from '../../api/swapApi';
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
  const valueDifference = selectedListing ? selectedListing.estimatedValue - requestedListing.estimatedValue : null;

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
                <img src={listing.images?.[0] || ''} alt={listing.title} />
                <div>
                  <p className="swap-mini-title">{listing.title}</p>
                  <p className="swap-mini-value">Est. ${listing.estimatedValue}</p>
                </div>
              </label>
            ))}
          </div>

          {selectedListing && (
            <div className="swap-value-preview">
              <p>Requested item: {requestedListing.title} (${requestedListing.estimatedValue})</p>
              <p>Your offer: {selectedListing.title} (${selectedListing.estimatedValue})</p>
              <p>
                {valueDifference === 0
                  ? 'These items have an even estimated value.'
                  : `Estimated value difference: $${Math.abs(valueDifference)}`}
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
