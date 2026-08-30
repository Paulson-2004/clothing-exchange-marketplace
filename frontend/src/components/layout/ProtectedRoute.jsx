import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Wraps a page element. Redirects to /login if the user isn't
// authenticated, and optionally to a fallback page if the route
// requires admin access the user doesn't have.
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAuthenticated, initializing } = useAuth();

  // While we're still checking session state (e.g. right after a page
  // refresh), don't redirect yet - that would incorrectly bounce a
  // logged-in user to /login before /auth/me has had a chance to respond.
  if (initializing) {
    return <div className="page-loading">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
