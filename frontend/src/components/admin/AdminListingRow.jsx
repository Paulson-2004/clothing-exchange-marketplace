import { Link } from 'react-router-dom';

// Table row for the admin listing list.

function AdminListingRow({ listing, onDelete }) {
  const ownerName = listing.owner?.name || 'Unknown';
  const ownerEmail = listing.owner?.email || '';

  return (
    <tr className="admin-table-row">
      <td className="admin-cell-listing">
        <div className="admin-listing-info">
          {listing.images?.[0] && (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="admin-listing-thumb"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
              }}
            />
          )}
          <Link to={`/listings/${listing._id}`}>{listing.title}</Link>
        </div>
      </td>
      <td>{listing.category}</td>
      <td>{listing.brand}</td>
      <td>
        <span className={`admin-badge admin-badge-${listing.status}`}>
          {listing.status}
        </span>
      </td>
      <td>${listing.estimatedValue}</td>
      <td>{ownerName}{ownerEmail ? ` (${ownerEmail})` : ''}</td>
      <td>{new Date(listing.createdAt).toLocaleDateString()}</td>
      <td className="admin-cell-actions">
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(listing)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default AdminListingRow;
