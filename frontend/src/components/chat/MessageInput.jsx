import { useState } from 'react';

const MAX_LENGTH = 2000;

function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Message cannot be empty');
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Message cannot exceed ${MAX_LENGTH} characters`);
      return;
    }

    setError('');
    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      {error && <p className="form-error">{error}</p>}
      <div className="message-input-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          maxLength={MAX_LENGTH}
          disabled={disabled || sending}
          aria-label="Message text"
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={disabled || sending || !text.trim()}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
