import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
        <h3>{title}</h3>
        <p className="listing-card-meta">
          {brand} • Size {size} • {condition}
        </p>
        <p className="listing-card-value">Est. value: ${estimatedValue}</p>
        <p className="listing-card-location">
          {location?.city && location?.state ? `${location.city}, ${location.state}` : 'Location not specified'}
        </p>
        {owner?.name && <p className="listing-card-owner">Listed by {owner.name}</p>}
      </div>
    </Link>
  );
}

export default ListingCard;
