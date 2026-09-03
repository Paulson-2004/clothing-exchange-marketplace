import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getListings } from '../api/listingApi';
import ListingCard from '../components/listing/ListingCard';
import ListingFilters from '../components/listing/ListingFilters';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';

const initialFilters = {
  search: '',
  category: '',
  size: '',
  condition: '',
  city: '',
  state: '',
};

function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  const fetchListings = useCallback(async (activeFilters) => {
    setStatus('loading');
    try {
      const data = await getListings(activeFilters);
      setListings(data.listings);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  }, []);

  // Refetch whenever filters change, with a short debounce so typing in
  // the search box doesn't fire a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchListings(filters);
    }, 400);
    return () => clearTimeout(timeout);
  }, [filters, fetchListings]);

  return (
    <div className="page-container marketplace-page">
      <div className="marketplace-header">
        <div>
          <h1>Browse Listings</h1>
          <p className="marketplace-subtitle">Swap clothes sustainably — no money involved.</p>
        </div>
        {isAuthenticated && (
          <Link to="/listings/new" className="btn btn-primary">
            + Create Listing
          </Link>
        )}
      </div>

      <ListingFilters filters={filters} onChange={setFilters} onReset={() => setFilters(initialFilters)} />

      {status === 'loading' && <Loader message="Loading listings…" />}

      {status === 'error' && (
        <ErrorMessage message="Could not load listings. Please try again." onRetry={() => fetchListings(filters)} />
      )}

      {status === 'success' && listings.length === 0 && (
        <EmptyState
          title="No listings match your filters"
          message="Try broadening your search, or check back later for new items."
          actionLabel={isAuthenticated ? 'Create the first listing' : undefined}
          onAction={isAuthenticated ? () => navigate('/listings/new') : undefined}
        />
      )}

      {status === 'success' && listings.length > 0 && (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
