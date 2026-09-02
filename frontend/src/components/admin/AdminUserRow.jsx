import { Link } from 'react-router-dom';

// Table row for the admin user list.

function AdminUserRow({ user, onToggleRole, isSelf }) {
  return (
    <tr className="admin-table-row">
      <td className="admin-cell-name">
        <Link to={`/admin/users/${user._id}`}>{user.name}</Link>
      </td>
      <td>{user.email}</td>
      <td>
        <span className={`admin-badge admin-badge-${user.role}`}>
          {user.role}
        </span>
      </td>
      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
      <td className="admin-cell-actions">
        {!isSelf && (
          <button
            className={`btn btn-sm ${user.role === 'admin' ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => onToggleRole(user)}
          >
            {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
          </button>
        )}
        {isSelf && <span className="admin-self-badge">You</span>}
      </td>
    </tr>
  );
}

export default AdminUserRow;
