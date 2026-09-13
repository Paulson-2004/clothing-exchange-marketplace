import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  available: 'Available',
  pending: 'Pending Swap',
  swapped: 'Swapped',
};

function ListingCard({ listing }) {
  const { _id, title, brand, size, condition, estimatedValue, location, status, images, owner } = listing;

  return (
    <Link to={`/listings/${_id}`} className="listing-card">
      <div className="listing-card-image">
        {images && images.length > 0 ? (
          <img src={images[0]} alt={title} loading="lazy" />
        ) : (
          <div className="listing-card-image-placeholder">No Image</div>
        )}
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
