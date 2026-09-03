import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMenu}>
        <svg
          className="navbar-brand-icon"
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
        <span>Clothing Exchange</span>
      </Link>

      <button
        type="button"
        className="navbar-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className="navbar-toggle-bar" />
        <span className="navbar-toggle-bar" />
        <span className="navbar-toggle-bar" />
      </button>

      <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
        {isAuthenticated ? (
          <>
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={closeMenu}>
                Admin Panel
              </Link>
            )}
            <Link to="/my-listings" onClick={closeMenu}>
              My Listings
            </Link>
            <Link to="/swap-requests" onClick={closeMenu}>
              Swap Requests
            </Link>
            <Link to="/chat" onClick={closeMenu}>
              Chat
            </Link>
            <Link to="/dashboard" onClick={closeMenu}>
              Dashboard
            </Link>
            <Link to="/profile" onClick={closeMenu}>
              Profile
            </Link>
            <span className="navbar-user">Hi, {user.name}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>
              Login
            </Link>
            <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
