function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString();
}

function ConversationList({ conversations, activeConversationId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="conversation-list-empty">
        <p>No conversations yet.</p>
        <p className="field-hint">Start one from an item or swap request.</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map((conversation) => {
        const isActive = conversation._id === activeConversationId;
        const hasUnread = conversation.unreadCount > 0;

        return (
          <button
            key={conversation._id}
            className={`conversation-list-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(conversation._id)}
          >
            <div className="conversation-list-item-top">
              <span className="conversation-name">{conversation.otherParticipant?.name || 'Unknown user'}</span>
              {conversation.lastMessageAt && (
                <span className="conversation-time">{formatTime(conversation.lastMessageAt)}</span>
              )}
            </div>
            <div className="conversation-list-item-bottom">
              <span className="conversation-preview">
                {conversation.latestMessage ? conversation.latestMessage.text : 'No messages yet'}
              </span>
              {hasUnread && <span className="conversation-unread-dot" aria-label="Unread messages" />}
            </div>
            {conversation.relatedSwapRequest && (
              <span className="conversation-swap-tag">
                Re: {conversation.relatedSwapRequest.requestedListing?.title || 'a swap'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ConversationList;
