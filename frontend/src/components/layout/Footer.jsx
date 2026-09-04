import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-brand-section">
          <Link to="/" className="footer-brand">
            <svg
              className="footer-brand-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 10h14l-4-4" />
              <path d="M17 14H3l4 4" />
            </svg>
            <span>ReWear</span>
          </Link>
          <p className="footer-tagline">
            A peer-to-peer clothing exchange marketplace. Trade pre-loved apparel locally and sustainably—with zero monetary transactions.
          </p>
        </div>

        <div className="footer-nav-section">
          <div className="footer-col">
            <h4 className="footer-col-title">Explore & Help</h4>
            <ul className="footer-links">
              <li>
                <Link to="/faq">Frequently Asked Questions</Link>
              </li>
              <li>
                <Link to="/recent-changes">Recent Changes</Link>
              </li>
              <li>
                <a
                  href="https://github.com/Paulson-2004/clothing-exchange-marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Source Code
                </a>
              </li>
              <li>
                <Link to="/">Browse Marketplace</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Member Tools</h4>
            <ul className="footer-links">
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/my-listings">My Listings</Link>
              </li>
              <li>
                <Link to="/swap-requests">Swap Requests</Link>
              </li>
              <li>
                <Link to="/chat">Negotiations & Chat</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; 2026 ReWear. A peer-to-peer clothing exchange marketplace.
        </p>
        <p className="footer-meta">
          <span>Non-monetary exchange</span> • <span>Sustainable fashion</span> • <span>Community powered</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
