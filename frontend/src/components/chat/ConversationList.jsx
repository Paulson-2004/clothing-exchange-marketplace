import { getOptimizedImageUrl } from '../../utils/imageUrl';

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
      <div className="conversation-list-empty" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>No conversations yet.</p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Start an exchange from any marketplace listing.</p>
      </div>
    );
  }

  return (
    <div className="exchange-conversation-list">
      {conversations.map((conversation) => {
        const isActive = conversation._id === activeConversationId;
        const hasUnread = conversation.unreadCount > 0;
        
        // Find an image to represent the conversation (prefer the other user's item, else your item)
        const swap = conversation.relatedSwapRequest;
        let contextImage = null;
        let contextTitle = 'a swap';
        
        if (swap) {
          const reqListing = swap.requestedListing;
          const offListing = swap.offeredListing;
          if (reqListing && offListing) {
            // Show the image of the requested item as the primary visual context
            contextImage = reqListing.images?.[0] || offListing.images?.[0];
            contextTitle = reqListing.title;
          }
        }

        return (
          <button
            key={conversation._id}
            className={`exchange-convo-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(conversation._id)}
          >
            {contextImage ? (
              <img 
                src={getOptimizedImageUrl(contextImage, { width: 90, height: 120 })}
                alt="Exchange context"
                className="exchange-convo-thumb"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
                }}
              />
            ) : (
              <div className="exchange-convo-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '1.5rem' }}>&middot;</span>
              </div>
            )}
            
            <div className="exchange-convo-info">
              <div className="exchange-convo-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="exchange-convo-name">{conversation.otherParticipant?.name || 'Unknown user'}</span>
                  {hasUnread && <span className="exchange-unread-dot" aria-label="Unread messages" />}
                </div>
                {conversation.lastMessageAt && (
                  <span className="exchange-convo-time">{formatTime(conversation.lastMessageAt)}</span>
                )}
              </div>
              <div className="exchange-convo-preview">
                {conversation.latestMessage ? conversation.latestMessage.text : 'No messages yet'}
              </div>
              {swap && (
                <div className="exchange-convo-re">
                  Re: {contextTitle}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ConversationList;
