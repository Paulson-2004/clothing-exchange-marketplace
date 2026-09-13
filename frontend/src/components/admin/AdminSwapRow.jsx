import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { getOptimizedImageUrl } from '../../utils/imageUrl';

function AdminSwapRow({ swap }) {
  const requesterName = swap.requester?.name || 'Unknown';
  const requesterEmail = swap.requester?.email || '';
  
  const requestedTitle = swap.requestedListing?.title || 'Deleted listing';
  const requestedOwner = swap.requestedListing?.owner?.name || 'Unknown';
  const requestedEmail = swap.requestedListing?.owner?.email || '';
  const requestedImage = swap.requestedListing?.images?.[0];
  const requestedValue = swap.requestedListing?.estimatedValue || 0;
  
  const offeredTitle = swap.offeredListing?.title || 'Deleted listing';
  const offeredImage = swap.offeredListing?.images?.[0];
  const offeredValue = swap.offeredListing?.estimatedValue || 0;

  return (
    <tr className="admin-table-row">
      <td className="admin-cell-status">
        <span className={`admin-role-badge ${swap.status}`}>
          {swap.status}
        </span>
      </td>
      
      <td>
        <div className="admin-swap-relationship">
          {/* Offered Item (Requester) */}
          <div className="admin-swap-listing">
            {offeredImage ? (
              <img
                src={getOptimizedImageUrl(offeredImage, { width: 160, height: 160 })}
                alt={offeredTitle}
                className="admin-swap-thumb"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'; }}
              />
            ) : (
              <div className="admin-swap-thumb" />
            )}
            <div className="admin-swap-meta">
              {swap.offeredListing?._id ? (
                <Link to={`/listings/${swap.offeredListing._id}`} className="admin-swap-title">{offeredTitle}</Link>
              ) : (
                <span className="admin-swap-title">{offeredTitle}</span>
              )}
              <span className="admin-swap-owner">{requesterName}</span>
              {requesterEmail && <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{requesterEmail}</span>}
            </div>
          </div>

          {/* Direction Icon */}
          <div className="admin-swap-direction">&harr;</div>

          {/* Requested Item (Owner) */}
          <div className="admin-swap-listing">
            {requestedImage ? (
              <img
                src={getOptimizedImageUrl(requestedImage, { width: 160, height: 160 })}
                alt={requestedTitle}
                className="admin-swap-thumb"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'; }}
              />
            ) : (
              <div className="admin-swap-thumb" />
            )}
            <div className="admin-swap-meta">
              {swap.requestedListing?._id ? (
                <Link to={`/listings/${swap.requestedListing._id}`} className="admin-swap-title">{requestedTitle}</Link>
              ) : (
                <span className="admin-swap-title">{requestedTitle}</span>
              )}
              <span className="admin-swap-owner">{requestedOwner}</span>
              {requestedEmail && <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{requestedEmail}</span>}
            </div>
          </div>
        </div>
      </td>

      <td style={{ verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="admin-swap-value">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>Offered:</span>
            {formatCurrency(offeredValue)}
          </div>
          <div className="admin-swap-value">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>Requested:</span>
            {formatCurrency(requestedValue)}
          </div>
        </div>
      </td>

      <td className="admin-cell-date" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', verticalAlign: 'middle' }}>
        {new Date(swap.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

export default AdminSwapRow;
