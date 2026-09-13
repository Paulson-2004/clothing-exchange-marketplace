import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { getOptimizedImageUrl } from '../../utils/imageUrl';

// Table row for the admin listing list.

function AdminListingRow({ listing, onDelete }) {
  const ownerName = listing.owner?.name || 'Unknown';
  const ownerEmail = listing.owner?.email || '';

  return (
    <tr className="admin-table-row">
      <td style={{ paddingRight: 0 }}>
        {listing.images?.[0] ? (
          <img
            src={getOptimizedImageUrl(listing.images[0], { width: 160, height: 160 })}
            alt={listing.title}
            style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px', backgroundColor: 'var(--color-surface-subtle)' }}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';
            }}
          />
        ) : (
          <div style={{ width: '40px', height: '50px', borderRadius: '4px', backgroundColor: 'var(--color-surface-subtle)' }} />
        )}
      </td>
      <td className="admin-cell-name">
        <Link to={`/listings/${listing._id}`} className="admin-user-name" style={{ display: 'block', marginBottom: '0.2rem' }}>
          {listing.title}
        </Link>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {listing.brand} &middot; {listing.category}
        </div>
      </td>
      <td className="admin-cell-owner">
        <div style={{ fontWeight: 500 }}>{ownerName}</div>
        {ownerEmail && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{ownerEmail}</div>}
      </td>
      <td className="admin-cell-status">
        <span className={`admin-role-badge ${listing.status}`}>
          {listing.status}
        </span>
      </td>
      <td className="admin-cell-value" style={{ fontWeight: 500 }}>
        {formatCurrency(listing.estimatedValue)}
      </td>
      <td className="admin-cell-location" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        {listing.location?.city ? `${listing.location.city}, ${listing.location.state}` : '—'}
      </td>
      <td className="admin-cell-date" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        {new Date(listing.createdAt).toLocaleDateString()}
      </td>
      <td className="admin-cell-actions" style={{ textAlign: 'right' }}>
        <div className="admin-action-links" style={{ justifyContent: 'flex-end' }}>
          <Link to={`/listings/${listing._id}`} className="admin-action-link">
            View
          </Link>
          <button
            className="admin-action-link danger"
            onClick={() => onDelete(listing)}
            title="Delete listing"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default AdminListingRow;
