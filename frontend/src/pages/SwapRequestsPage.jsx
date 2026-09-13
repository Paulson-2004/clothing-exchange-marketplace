import { useState, useEffect, useCallback } from 'react';
import {
  getIncomingRequests,
  getSentRequests,
  acceptSwapRequest,
  rejectSwapRequest,
  cancelSwapRequest,
  completeSwapRequest,
} from '../api/swapApi';
import SwapRequestCard from '../components/swap/SwapRequestCard';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

function SwapRequestsPage() {
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'sent'
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAll = useCallback(async () => {
    setStatus('loading');
    try {
      const [incomingData, sentData] = await Promise.all([getIncomingRequests(), getSentRequests()]);
      setIncoming(incomingData.swapRequests);
      setSent(sentData.swapRequests);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const runAction = async (id, actionFn, confirmMessage, successMessage) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setActionError('');
    setActionSuccess('');
    setBusyId(id);
    try {
      await actionFn(id);
      await fetchAll();
      setActionSuccess(successMessage);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not complete that action. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAccept = (id) => runAction(id, acceptSwapRequest, 'Accept this swap request? This will mark both items as pending.', 'Swap request accepted! Items are now pending.');
  const handleReject = (id) => runAction(id, rejectSwapRequest, 'Decline this swap request?', 'Swap request declined.');
  const handleCancel = (id) => runAction(id, cancelSwapRequest, 'Cancel this swap request?', 'Swap request cancelled.');
  const handleComplete = (id) =>
    runAction(id, completeSwapRequest, 'Mark this swap as completed? Both items will be marked as swapped.', 'Swap marked as completed!');

  const activeList = activeTab === 'incoming' ? incoming : sent;

  return (
    <div className="page-container">
      <h1 className="editorial-title">Swap Requests</h1>

      <div className="swap-tabs">
        <button
          className={`swap-tab ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming ({incoming.length})
        </button>
        <button className={`swap-tab ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
          Sent ({sent.length})
        </button>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}
      {actionSuccess && <p className="form-success">{actionSuccess}</p>}

      {status === 'loading' && <Loader message="Loading swap requests…" />}

      {status === 'error' && <ErrorMessage message="Could not load swap requests." onRetry={fetchAll} />}

      {status === 'success' && activeList.length === 0 && (
        <EmptyState
          title={activeTab === 'incoming' ? 'No incoming requests' : 'No sent requests'}
          message={
            activeTab === 'incoming'
              ? 'When someone wants to swap for one of your listings, it will show up here.'
              : 'Browse the marketplace and request a swap to see it here.'
          }
        />
      )}

      {status === 'success' && activeList.length > 0 && (
        <div className="swap-request-list">
          {activeList.map((swapRequest) => (
            <SwapRequestCard
              key={swapRequest._id}
              swapRequest={swapRequest}
              variant={activeTab}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
              onComplete={handleComplete}
              busy={busyId === swapRequest._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SwapRequestsPage;
