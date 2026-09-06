import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getListings } from '../api/listingApi';
import ListingCard from '../components/listing/ListingCard';
import ListingFilters from '../components/listing/ListingFilters';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import Pagination from '../components/common/Pagination';
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const fetchListings = useCallback(async (activeFilters, requestedPage = 1, requestId) => {
    if (!mountedRef.current || requestId !== requestIdRef.current) return;

    setStatus('loading');
    try {
      const data = await getListings({ ...activeFilters, page: requestedPage, limit: 24 });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setListings(data.listings);
      setPage(data.page || requestedPage);
      setTotalPages(data.totalPages || 1);
      setStatus('success');
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setStatus('error');
    }
  }, []);

  // Refetch whenever filters/page change, with a short debounce so typing
  // in the search box doesn't fire a request on every keystroke.
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const timeout = setTimeout(() => {
      fetchListings(filters, page, requestId);
    }, 350);
    return () => {
      clearTimeout(timeout);
      // Invalidate any in-flight request from this effect, including on unmount.
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [filters, page, fetchListings]);

  const handleFiltersChange = (nextFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  return (
    <div className="page-container marketplace-page">
      <div className="marketplace-hero">
        <div className="marketplace-hero-content">
          <span className="marketplace-hero-badge">Direct Item-for-Item Barter</span>
          <h1 className="marketplace-hero-title">Swap Clothes. No Money Needed.</h1>
          <p className="marketplace-hero-desc">
            ReWear is a peer-to-peer clothing exchange marketplace. Give unworn clothing a second life, discover compatible pieces locally, and swap directly with zero monetary transactions.
          </p>
        </div>
        {isAuthenticated ? (
          <Link to="/listings/new" className="btn btn-primary marketplace-hero-cta">
            + Create Listing
          </Link>
        ) : (
          <Link to="/register" className="btn btn-primary marketplace-hero-cta">
            Start Swapping
          </Link>
        )}
      </div>

      <ListingFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={() => handleFiltersChange(initialFilters)}
      />

      {status === 'loading' && <Loader message="Loading listings…" />}

      {status === 'error' && (
        <ErrorMessage
          message="Could not load listings. Please try again."
          onRetry={() => {
            const requestId = ++requestIdRef.current;
            fetchListings(filters, page, requestId);
          }}
        />
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
        <>
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default HomePage;
