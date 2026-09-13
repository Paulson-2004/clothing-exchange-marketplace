import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';

const STATUS_LABELS = {
  available: 'Available',
  pending: 'Pending Swap',
  swapped: 'Swapped',
};

function ListingCard({ listing }) {
  const { _id, title, brand, size, condition, estimatedValue, location, status, images, owner } = listing;
  const [currentSrc, setCurrentSrc] = useState(images?.[0] || DEFAULT_FALLBACK_IMAGE);

  useEffect(() => {
    setCurrentSrc(images?.[0] || DEFAULT_FALLBACK_IMAGE);
  }, [images]);

  return (
    <Link to={`/listings/${_id}`} className="listing-card">
      <div className="listing-card-image">
        <img
          src={currentSrc}
          alt={title}
          loading="lazy"
          onError={() => setCurrentSrc(DEFAULT_FALLBACK_IMAGE)}
        />
        <span className={`listing-status listing-status-${status}`}>{STATUS_LABELS[status] || status}</span>
      </div>

      <div className="listing-card-body">
        <div className="listing-card-meta">
          <span className="listing-card-brand">{brand}</span>
          <span className="listing-card-dot">•</span>
          <span className="listing-card-size">Size {size}</span>
          <span className="listing-card-dot">•</span>
          <span className="listing-card-condition">{condition}</span>
        </div>
        <h3 title={title}>{title}</h3>
        <p className="listing-card-value">Est. value: {formatCurrency(estimatedValue)}</p>
        <div className="listing-card-footer">
          <span className="listing-card-location">
            {location?.city && location?.state ? `${location.city}, ${location.state}` : 'Location not specified'}
          </span>
          {owner?.name && <span className="listing-card-owner">by {owner.name}</span>}
        </div>
      </div>
    </Link>
  );
}

export default ListingCard;
