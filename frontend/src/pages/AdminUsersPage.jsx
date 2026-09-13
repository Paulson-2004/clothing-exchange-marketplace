import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminUsers, toggleUserRole, adminDeleteUser } from '../api/adminApi';
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
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

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

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await adminDeleteUser(deleteConfirmUser._id);
      setDeleteConfirmUser(null);
      fetchUsers(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setDeleteConfirmUser(null);
    }
  };

  return (
    <div className="page-container admin-page-wide admin-users-page">
      <div className="admin-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Admin / Users</div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>
            Users
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '1.05rem' }}>
            Manage the members of the ReWear exchange community.
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Dashboard &rarr;</Link>
      </div>

      {/* Filters */}
      <div className="admin-workspace-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', minWidth: '300px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '0' }}>Search</button>
        </form>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit' }}
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {totalCount} user{totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {loading && <Loader message="Loading users..." />}
      {error && <ErrorMessage message={error} onRetry={() => fetchUsers(page)} />}

      {!loading && !error && users.length === 0 && (
        <EmptyState title="No users found" message="Try adjusting your search or filters." />
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="admin-workspace-table-container">
            <table className="admin-workspace-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>User</th>
                  <th style={{ width: '15%' }}>Role</th>
                  <th style={{ width: '20%' }}>Location</th>
                  <th style={{ width: '15%' }}>Joined</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <AdminUserRow
                    key={u._id}
                    user={u}
                    isSelf={currentUser?.id === u._id}
                    onToggleRole={(usr) => setConfirmUser(usr)}
                    onDeleteUser={(usr) => setDeleteConfirmUser(usr)}
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
          confirmLabel={confirmUser.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
          onConfirm={handleToggleRole}
          onCancel={() => setConfirmUser(null)}
          danger={confirmUser.role === 'admin'}
        />
      )}

      {deleteConfirmUser && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to completely delete "${deleteConfirmUser.name}" and all their listings/swaps? This action cannot be undone.`}
          confirmLabel="Permanently Delete User"
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteConfirmUser(null)}
          danger={true}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;

