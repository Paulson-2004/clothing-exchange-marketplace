import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getConversations } from '../api/chatApi';
import { useAuth } from '../context/AuthContext';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import '../chat.css';

function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  
  // Allow deep-linking into a specific conversation via URL param (e.g. /chat?conversation=123)
  const [activeId, setActiveId] = useState(searchParams.get('conversation') || null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations);
      setStatus('success');

      // If nothing is selected yet (no ?conversation= param and no prior
      // selection), default to the most recent conversation.
      setActiveId((current) => {
        if (current) return current;
        return data.conversations.length > 0 ? data.conversations[0]._id : null;
      });
    } catch (err) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelect = (id) => {
    setActiveId(id);
    setSearchParams({ conversation: id }, { replace: true });
  };

  // Callback passed to MessageThread. When the user views a thread, MessageThread
  // tells the backend to mark it as read, then calls this function so ChatPage
  // can clear the "unread" dot in the sidebar instantly without a full API refetch.
  const handleRead = (conversationId) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleBack = () => {
    setActiveId(null);
    setSearchParams({}, { replace: true });
  };

  const activeConversation = conversations.find((c) => c._id === activeId) || null;

  return (
    <div className="chat-page page-container chat-page-container" style={{ maxWidth: '1400px' }}>
      <div className="marketplace-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Negotiation Studio</div>
        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>
          Exchange Chat
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '1.05rem' }}>
          Coordinate swaps and negotiate directly with other members.
        </p>
      </div>

      {status === 'loading' && <Loader message="Loading conversations…" />}
      {status === 'error' && <ErrorMessage message="Could not load conversations." onRetry={fetchConversations} />}

      {status === 'success' && (
        <div className={`chat-layout ${activeConversation ? 'has-active' : ''}`}>
          <div className="chat-sidebar">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeId}
              onSelect={handleSelect}
            />
          </div>
          <div className="chat-main">
            <MessageThread
              conversation={activeConversation}
              currentUserId={user?.id}
              onRead={handleRead}
              onBack={handleBack}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
