import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getConversations } from '../api/chatApi';
import { useAuth } from '../context/AuthContext';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
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

  // Called by MessageThread after it marks a conversation's messages as
  // read, so the sidebar's unread dot clears without a full refetch.
  const handleRead = (conversationId) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const activeConversation = conversations.find((c) => c._id === activeId) || null;

  return (
    <div className="page-container chat-page-container">
      <h1>Messages</h1>

      {status === 'loading' && <Loader message="Loading conversations…" />}
      {status === 'error' && <ErrorMessage message="Could not load conversations." onRetry={fetchConversations} />}

      {status === 'success' && (
        <div className="chat-layout">
          <div className="chat-sidebar">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeId}
              onSelect={handleSelect}
            />
          </div>
          <div className="chat-main">
            <MessageThread conversation={activeConversation} currentUserId={user?.id} onRead={handleRead} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
