import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../common/Icon';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
        <span>ReWear</span>
      </Link>

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
          <div className="navbar-auth-actions">
            <Link to="/login" className="navbar-login-link" onClick={closeMenu}>
              Login
            </Link>
            <Link to="/register" className="btn btn-primary navbar-register-btn" onClick={closeMenu}>
              Register
            </Link>
          </div>
        )}
      </div>

      <div className="navbar-controls">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={theme === 'dark'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>

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
      </div>
    </nav>
  );
}

export default Navbar;
