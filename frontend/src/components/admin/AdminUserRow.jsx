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
        <Link to={`/admin/users/${user._id}`}>{user.name}</Link>
      </td>
      <td className="admin-cell-email">{user.email}</td>
      <td className="admin-cell-role">
        <span className={`admin-badge admin-badge-${user.role}`}>
          {user.role}
        </span>
      </td>
      <td className="admin-cell-date">{new Date(user.createdAt).toLocaleDateString()}</td>
      <td className="admin-cell-actions">
        {isDeleted ? (
          <span className="admin-badge admin-badge-deleted admin-badge-cancelled">Deleted</span>
        ) : isSelf ? (
          <span className="admin-self-badge">You</span>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${user.role === 'admin' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onToggleRole(user)}
            >
              {user.role === 'admin' ? 'Demote' : 'Promote'}
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDeleteUser(user)}
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
