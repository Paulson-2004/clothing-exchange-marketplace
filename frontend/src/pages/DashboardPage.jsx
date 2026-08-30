import { useAuth } from '../context/AuthContext';

// This is intentionally minimal for Phase 2 - just enough to prove
// that ProtectedRoute + auth state work end-to-end. The real dashboard
// (listings, swap activity, etc.) is built in a later phase.
function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}. This page is only reachable when logged in.</p>
      <p>
        <strong>Email:</strong> {user?.email}
        <br />
        <strong>Role:</strong> {user?.role}
      </p>
    </div>
  );
}

export default DashboardPage;
