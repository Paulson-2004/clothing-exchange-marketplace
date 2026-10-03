import { useEffect, useState } from 'react';
import { subscribeColdStartNotice } from '../../api/axiosClient';

// Global, UX-only notice shown ONLY while a backend request has genuinely
// been pending past the cold-start threshold (see axiosClient).
// - Never shows immediately on page load or for fast requests.
// - Not an error: reassures the user the server may be waking up.
// - Unmount-safe: subscription is cleaned up on unmount.
function ColdStartNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeColdStartNotice(setVisible), []);

  if (!visible) return null;

  return (
    <div className="cold-start-notice" role="status" aria-live="polite">
      <span className="cold-start-notice-spinner" aria-hidden="true" />
      <div className="cold-start-notice-text">
        <p className="cold-start-notice-title">Backend is waking up…</p>
        <p className="cold-start-notice-subtitle">
          Render&apos;s free hosting may take a little longer to respond after
          inactivity. Please wait — no need to refresh.
        </p>
      </div>
    </div>
  );
}

export default ColdStartNotice;
