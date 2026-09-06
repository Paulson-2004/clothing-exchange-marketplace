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

  // Each conversation gets its own generation. Async work may finish after
  // a conversation switch, so every response and timer must prove that it
  // still belongs to the active generation before touching component state.
  const conversationGenerationRef = useRef(0);
  const activeFetchRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  const fetchMessages = async (conversationId, generation) => {
    // Prevent overlapping polls for the same conversation, but never let an
    // old conversation's request block the newly active conversation.
    if (activeFetchRef.current?.generation === generation) return;

    activeFetchRef.current = { generation };
    try {
      const data = await getMessages(conversationId);
      if (conversationGenerationRef.current !== generation) return;

      const nextMessages = data.messages || [];
      setMessages((previousMessages) => {
        if (conversationGenerationRef.current !== generation) return previousMessages;

        const previousLast = previousMessages[previousMessages.length - 1];
        const nextLast = nextMessages[nextMessages.length - 1];
        const unchanged =
          previousMessages.length === nextMessages.length &&
          previousMessages[0]?._id === nextMessages[0]?._id &&
          previousLast?._id === nextLast?._id;

        // Polling should not cause a message-thread render when the server
        // returned the same bounded window as the previous request.
        return unchanged ? previousMessages : nextMessages;
      });
    } catch (err) {
      if (conversationGenerationRef.current === generation) {
        setStatus((prev) => (
          conversationGenerationRef.current === generation && prev === 'loading' ? 'error' : prev
        ));
      }
    } finally {
      // A newer conversation may already own the active fetch slot.
      if (activeFetchRef.current?.generation === generation) {
        activeFetchRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!conversation?._id) return;

    const generation = ++conversationGenerationRef.current;
    const isCurrent = () => conversationGenerationRef.current === generation;

    setStatus('loading');
    setMessages([]);
    setSwapActionBusy(false);
    prevMessagesLengthRef.current = 0;

    let cancelled = false;

    const clearPoll = () => {
      if (pollTimeoutRef.current?.generation === generation) {
        clearTimeout(pollTimeoutRef.current.timeoutId);
        pollTimeoutRef.current = null;
      }
    };

    const refresh = async () => {
      await fetchMessages(conversation._id, generation);
      if (!cancelled && isCurrent()) {
        setStatus((prev) => (
          !cancelled && isCurrent() && prev === 'loading' ? 'success' : prev
        ));
      }
    };

    const schedulePoll = () => {
      clearPoll();
      if (!cancelled && isCurrent() && !document.hidden) {
        const timeoutId = setTimeout(async () => {
          if (!isCurrent()) return;
          await refresh();
          if (isCurrent()) schedulePoll();
        }, POLL_INTERVAL_MS);
        pollTimeoutRef.current = { generation, timeoutId };
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearPoll();
        return;
      }

      refresh().finally(() => {
        if (isCurrent()) schedulePoll();
      });
    };

    refresh().finally(() => {
      if (isCurrent()) schedulePoll();
    });

    markConversationRead(conversation._id)
      .then(() => {
        if (!cancelled && isCurrent()) onRead?.(conversation._id);
      })
      .catch(() => {});

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      conversationGenerationRef.current += 1;
      clearPoll();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?._id]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // If this is the initial load of messages for a conversation
    const isInitialLoad = prevMessagesLengthRef.current === 0 && messages.length > 0;
    
    // If the user is near the bottom (within 150px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isInitialLoad || isNearBottom) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isInitialLoad ? 'auto' : 'smooth'
      });
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    setCurrentSwapStatus(conversation?.relatedSwapRequest?.status);
    setSwapActionError('');
  }, [conversation?._id, conversation?.relatedSwapRequest?.status]);

  const handleSend = async (text) => {
    const generation = conversationGenerationRef.current;
    const data = await sendMessage(conversation._id, text);
    if (conversationGenerationRef.current !== generation) return;

    setMessages((prev) => (
      conversationGenerationRef.current === generation ? [...prev, data.message] : prev
    ));
    
    setTimeout(() => {
      if (conversationGenerationRef.current !== generation) return;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const handleSwapAction = async (actionFn, confirmMsg, nextStatus) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const generation = conversationGenerationRef.current;
    const swapRequestId = conversation.relatedSwapRequest._id;
    setSwapActionError('');
    setSwapActionBusy(true);
    try {
      await actionFn(swapRequestId);
      if (conversationGenerationRef.current !== generation) return;
      setCurrentSwapStatus((prev) => (
        conversationGenerationRef.current === generation ? nextStatus : prev
      ));
    } catch (err) {
      if (conversationGenerationRef.current === generation) {
        const message = err.response?.data?.message || 'Could not update swap. Please try again.';
        setSwapActionError((prev) => (
          conversationGenerationRef.current === generation ? message : prev
        ));
      }
    } finally {
      if (conversationGenerationRef.current === generation) {
        setSwapActionBusy((prev) => (
          conversationGenerationRef.current === generation ? false : prev
        ));
      }
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
              &larr; Back
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

      <div className="message-thread-body" ref={scrollContainerRef}>
        {status === 'loading' && <Loader message="Loading messages&hellip;" />}
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
      </div>

      <MessageInput onSend={handleSend} disabled={status === 'loading'} />
    </div>
  );
}

export default MessageThread;
