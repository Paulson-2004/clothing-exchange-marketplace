import { Link } from 'react-router-dom';

// Table row for the admin user list.

function AdminUserRow({ user, onToggleRole, onDeleteUser, isSelf }) {
  // Anonymized/deleted accounts have an email generated as deleted_<timestamp>_<id>@example.com
  // Using a strict regex matching timestamp digits and 24-char hex ID to avoid false positives.
  const isDeleted = Boolean(
    user?.email &&
    /^deleted_\d+_[a-fA-F0-9]{24}@example\.com$/.test(user.email)
  );

  return (
    <tr className="admin-table-row">
      <td className="admin-cell-name">
        <Link to={`/admin/users/${user._id}`} className="admin-user-name">{user.name}</Link>
        <div className="admin-user-email">{user.email}</div>
      </td>
      <td className="admin-cell-role">
        <span className={`admin-role-badge ${user.role} ${isDeleted ? 'deleted' : ''}`}>
          {isDeleted ? 'Deleted' : user.role}
        </span>
      </td>
      <td className="admin-cell-location" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        {user.location?.city ? `${user.location.city}, ${user.location.state}` : '—'}
      </td>
      <td className="admin-cell-date" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="admin-cell-actions">
        {isDeleted ? (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>No actions</span>
        ) : (
          <div className="admin-action-links" style={{ justifyContent: 'flex-end' }}>
            <button
              className="admin-action-link"
              onClick={() => onToggleRole(user)}
              disabled={isSelf}
              style={{ opacity: isSelf ? 0.5 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
              title={isSelf ? "Cannot demote yourself" : `Change role to ${user.role === 'admin' ? 'user' : 'admin'}`}
            >
              {user.role === 'admin' ? 'Demote' : 'Make Admin'}
            </button>
            <button
              className="admin-action-link danger"
              onClick={() => onDeleteUser(user)}
              disabled={isSelf}
              style={{ opacity: isSelf ? 0.5 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
              title={isSelf ? "Cannot delete yourself" : "Delete user"}
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default AdminUserRow;
