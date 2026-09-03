import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMessages, sendMessage, markConversationRead } from '../../api/chatApi';
import {
  acceptSwapRequest,
  rejectSwapRequest,
  cancelSwapRequest,
  completeSwapRequest,
} from '../../api/swapApi';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import MessageInput from './MessageInput';

const POLL_INTERVAL_MS = 4000;

function formatTimestamp(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// `conversation` is the summary object from the conversation list
// (otherParticipant, relatedSwapRequest, etc). `onRead` lets the parent
// page refresh the conversation list's unread counts after this thread
// marks messages as read.
function MessageThread({ conversation, currentUserId, onRead, onBack }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [swapActionBusy, setSwapActionBusy] = useState(false);
  const [swapActionError, setSwapActionError] = useState('');
  const [currentSwapStatus, setCurrentSwapStatus] = useState(conversation?.relatedSwapRequest?.status);

  // Guards against overlapping poll requests if one is slow to resolve,
  // and lets the interval be cleared cleanly on conversation change or
  // unmount. Using refs here (rather than state) avoids re-triggering
  // the effect and keeps the polling logic isolated in one place - if
  // this is ever swapped for Socket.io, only this effect needs to change.
  const isFetchingRef = useRef(false);
  const intervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = async (conversationId) => {
    if (isFetchingRef.current) return; // skip if a fetch is already in flight
    isFetchingRef.current = true;
    try {
      const data = await getMessages(conversationId);
      setMessages(data.messages);
    } catch (err) {
      // Only surface a hard error state on the very first load; a
      // transient failure during background polling shouldn't blank
      // out an already-working conversation view.
      setStatus((prev) => (prev === 'loading' ? 'error' : prev));
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!conversation?._id) return;

    setStatus('loading');
    setMessages([]);

    let cancelled = false;

    const load = async () => {
      await fetchMessages(conversation._id);
      if (!cancelled) setStatus((prev) => (prev === 'loading' ? 'success' : prev));
    };
    load();

    // Mark this conversation's incoming messages as read as soon as it's opened.
    markConversationRead(conversation._id)
      .then(() => onRead?.(conversation._id))
      .catch(() => {
        /* non-critical - unread badge just won't clear this time */
      });

    // Start polling. Cleared below whenever the conversation changes or
    // this component unmounts, so there is never more than one active
    // interval at a time.
    intervalRef.current = setInterval(() => {
      fetchMessages(conversation._id).then(() => {
        setStatus((prev) => (prev === 'loading' ? 'success' : prev));
      });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setCurrentSwapStatus(conversation?.relatedSwapRequest?.status);
    setSwapActionError('');
  }, [conversation?._id, conversation?.relatedSwapRequest?.status]);

  const handleSend = async (text) => {
    const data = await sendMessage(conversation._id, text);
    setMessages((prev) => [...prev, data.message]);
  };

  const handleSwapAction = async (actionFn, confirmMsg, nextStatus) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setSwapActionError('');
    setSwapActionBusy(true);
    try {
      await actionFn(conversation.relatedSwapRequest._id);
      setCurrentSwapStatus(nextStatus);
    } catch (err) {
      setSwapActionError(err.response?.data?.message || 'Could not update swap. Please try again.');
    } finally {
      setSwapActionBusy(false);
    }
  };

  if (!conversation) {
    return (
      <div className="message-thread-empty">
        <p>Select a conversation to start chatting.</p>
      </div>
    );
  }

  const swap = conversation.relatedSwapRequest;
  const requesterId = swap?.requester?._id ? swap.requester._id.toString() : swap?.requester?.toString();
  const isRequester = requesterId && currentUserId && requesterId === currentUserId.toString();
  const displayStatus = currentSwapStatus || swap?.status;

  return (
    <div className="message-thread">
      <div className="message-thread-header">
        <div className="message-thread-header-title">
          {onBack && (
            <button
              type="button"
              className="chat-mobile-back-btn"
              onClick={onBack}
              aria-label="Back to conversations list"
            >
              ← Back
            </button>
          )}
          <h3>{conversation.otherParticipant?.name || 'Unknown user'}</h3>
        </div>
        {swap && (
          <div className="message-thread-swap-bar">
            <div className="message-thread-swap-info">
              <span className={`swap-status swap-status-${displayStatus}`}>{displayStatus}</span>
              {swap.requestedListing && (
                <Link to={`/listings/${swap.requestedListing._id}`} className="message-thread-swap-link">
                  {swap.requestedListing.title}
                </Link>
              )}
              <span className="swap-arrow">⇄</span>
              {swap.offeredListing && (
                <Link to={`/listings/${swap.offeredListing._id}`} className="message-thread-swap-link">
                  {swap.offeredListing.title}
                </Link>
              )}
            </div>

            <div className="message-thread-swap-actions">
              {displayStatus === 'pending' && !isRequester && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      handleSwapAction(
                        acceptSwapRequest,
                        'Accept this swap request? This will mark both items as pending.',
                        'accepted'
                      )
                    }
                    disabled={swapActionBusy}
                  >
                    Accept Swap
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary btn-danger"
                    onClick={() => handleSwapAction(rejectSwapRequest, 'Reject this swap request?', 'rejected')}
                    disabled={swapActionBusy}
                  >
                    Reject
                  </button>
                </>
              )}

              {displayStatus === 'pending' && isRequester && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary btn-danger"
                  onClick={() => handleSwapAction(cancelSwapRequest, 'Cancel this swap request?', 'cancelled')}
                  disabled={swapActionBusy}
                >
                  Cancel Request
                </button>
              )}

              {displayStatus === 'accepted' && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    handleSwapAction(
                      completeSwapRequest,
                      'Mark this swap as completed? Both items will be marked as swapped.',
                      'completed'
                    )
                  }
                  disabled={swapActionBusy}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        )}
        {swapActionError && <p className="form-error swap-action-error">{swapActionError}</p>}
      </div>

      <div className="message-thread-body">
        {status === 'loading' && <Loader message="Loading messages…" />}
        {status === 'error' && <ErrorMessage message="Could not load messages." />}

        {status === 'success' && messages.length === 0 && (
          <div className="message-thread-empty">
            <p>No messages yet. Say hello!</p>
          </div>
        )}

        {status === 'success' &&
          messages.map((message) => {
            const isOwn = message.sender?._id === currentUserId;
            return (
              <div key={message._id} className={`message-bubble-row ${isOwn ? 'own' : 'other'}`}>
                <div className="message-bubble">
                  <p className="message-text">{message.text}</p>
                  <span className="message-timestamp">{formatTimestamp(message.createdAt)}</span>
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={handleSend} disabled={status === 'loading'} />
    </div>
  );
}

export default MessageThread;
