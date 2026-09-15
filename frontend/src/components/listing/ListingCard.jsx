import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { getOptimizedImageUrl } from '../../utils/imageUrl';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80';

const STATUS_LABELS = {
  available: 'Available',
  pending: 'Pending Swap',
  swapped: 'Swapped',
};

function ListingCard({ listing }) {
  const { _id, title, brand, size, condition, estimatedValue, location, status, images, owner } = listing;
  
  // We maintain a local state for the image source.
  // WHY: If the image fails to load (e.g. broken Cloudinary link), the onError handler
  // below swaps this state to the DEFAULT_FALLBACK_IMAGE so the UI doesn't look broken.
  const [currentSrc, setCurrentSrc] = useState(
    getOptimizedImageUrl(images?.[0]) || DEFAULT_FALLBACK_IMAGE
  );

  // When React reuses this DOM element for a DIFFERENT listing (e.g., during pagination
  // or filtering), we must reset the local image state to the new listing's image.
  useEffect(() => {
    setCurrentSrc(getOptimizedImageUrl(images?.[0]) || DEFAULT_FALLBACK_IMAGE);
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
