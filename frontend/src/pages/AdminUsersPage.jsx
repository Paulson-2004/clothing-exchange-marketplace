import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminUsers, toggleUserRole } from '../api/adminApi';
import AdminUserRow from '../components/admin/AdminUserRow';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmUser, setConfirmUser] = useState(null);

  const fetchUsers = async (p = page) => {
    try {
      setLoading(true);
      setError('');
      const params = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const data = await getAdminUsers(params);
      setUsers(data.users);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleRole = async () => {
    if (!confirmUser) return;
    try {
      await toggleUserRole(confirmUser._id);
      setConfirmUser(null);
      fetchUsers(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
      setConfirmUser(null);
    }
  };

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <Link to="/admin" className="btn btn-secondary btn-sm">← Back to Dashboard</Link>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <form onSubmit={handleSearch} className="admin-search-form">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <p className="admin-count">{totalCount} user{totalCount !== 1 ? 's' : ''} found</p>

      {loading && <Loader message="Loading users..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchUsers(page)} />}

      {!loading && !error && users.length === 0 && (
        <EmptyState title="No users found" message="Try adjusting your search or filters." />
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <AdminUserRow
                    key={u._id}
                    user={u}
                    isSelf={currentUser?.id === u._id}
                    onToggleRole={(usr) => setConfirmUser(usr)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchUsers(p)} />
        </>
      )}

      {confirmUser && (
        <ConfirmModal
          title="Change User Role"
          message={`Are you sure you want to ${confirmUser.role === 'admin' ? 'demote' : 'promote'} "${confirmUser.name}" ${confirmUser.role === 'admin' ? 'to regular user' : 'to admin'}?`}
          confirmLabel={confirmUser.role === 'admin' ? 'Demote' : 'Promote'}
          danger={confirmUser.role === 'admin'}
          onConfirm={handleToggleRole}
          onCancel={() => setConfirmUser(null)}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;
