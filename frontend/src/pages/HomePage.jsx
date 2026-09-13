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

import { getOptimizedImageUrl } from '../utils/imageUrl';

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

  const isDefaultView = page === 1 && Object.values(filters).every(v => v === '' || v == null);
  const availableListings = listings.filter(l => l.status === 'available');
  
  const heroItems = [];
  const latestItems = [];
  const usedCategories = new Set();
  
  // 1. Try to pick 3 distinct categories for the hero for visual variety
  for (const item of availableListings) {
    if (heroItems.length < 3 && !usedCategories.has(item.category)) {
      heroItems.push(item);
      usedCategories.add(item.category);
    }
  }
  // 2. Fill the rest if we didn't get 3 distinct categories
  for (const item of availableListings) {
    if (heroItems.length < 3 && !heroItems.find(h => h._id === item._id)) {
      heroItems.push(item);
    }
  }
  // 3. Get the next 4 newest available items for 'Latest on ReWear'
  for (const item of availableListings) {
    if (latestItems.length < 4) {
      latestItems.push(item);
    }
  }
  
  const latestIds = new Set(latestItems.map(l => String(l._id)));
  const remainingListings = isDefaultView 
    ? availableListings.filter(l => !latestIds.has(String(l._id))) 
    : listings;

  return (
    <div className="page-container marketplace-page">
      <div className="marketplace-hero editorial-hero">
        <div className="editorial-hero-content">
          <span className="marketplace-hero-badge">Circular Fashion</span>
          <h1 className="marketplace-hero-title">Swap, Don't Shop.</h1>
          <p className="marketplace-hero-desc">
            Discover premium pre-loved clothing and trade your unworn pieces directly with others. Build your wardrobe sustainably, zero money required.
          </p>
          {isAuthenticated ? (
            <Link to="/listings/new" className="btn btn-primary marketplace-hero-cta">
              List an Item
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary marketplace-hero-cta">
              Join the Exchange
            </Link>
          )}
        </div>
        <div className="editorial-hero-image-container">
          {status === 'success' && heroItems.length >= 3 ? (
            <div className="editorial-collage">
              <Link to={`/listings/${heroItems[0]._id}`} className="collage-main">
                <img src={getOptimizedImageUrl(heroItems[0].images?.[0], { width: 800, height: 1000, crop: 'fill' })} alt={heroItems[0].title} />
              </Link>
              <div className="collage-secondary">
                <Link to={`/listings/${heroItems[1]._id}`}>
                  <img src={getOptimizedImageUrl(heroItems[1].images?.[0], { width: 400, height: 500, crop: 'fill' })} alt={heroItems[1].title} />
                </Link>
                <Link to={`/listings/${heroItems[2]._id}`}>
                  <img src={getOptimizedImageUrl(heroItems[2].images?.[0], { width: 400, height: 500, crop: 'fill' })} alt={heroItems[2].title} />
                </Link>
              </div>
            </div>
          ) : status === 'success' && heroItems.length > 0 ? (
            <div className="editorial-collage" style={{ gridTemplateColumns: '1fr' }}>
              <Link to={`/listings/${heroItems[0]._id}`} className="collage-main">
                <img src={getOptimizedImageUrl(heroItems[0].images?.[0], { width: 800, height: 1000, crop: 'fill' })} alt={heroItems[0].title} />
              </Link>
            </div>
          ) : (
            <div className="editorial-hero-image">
              <div className="hero-placeholder-shimmer"></div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 2rem' }}>
        
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
            {isDefaultView && latestItems.length > 0 ? (
              <>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1.5rem', letterSpacing: '-0.02em', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  Latest on ReWear
                </h2>
                <div className="listing-grid" style={{ marginBottom: '4rem' }}>
                  {latestItems.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
                
                {remainingListings.length > 0 && (
                  <>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1.5rem', letterSpacing: '-0.02em', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                      Explore the Marketplace
                    </h2>
                    <div className="listing-grid">
                      {remainingListings.map((listing) => (
                        <ListingCard key={listing._id} listing={listing} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1.5rem', letterSpacing: '-0.02em', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  Marketplace Results
                </h2>
                <div className="listing-grid">
                  {remainingListings.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
            
            {isDefaultView && (
              <div className="how-it-works-section">
                <h2 className="how-it-works-title">
                  How ReWear Works
                </h2>
                <div className="how-it-works-steps">
                  <div className="step">
                    <span className="step-number">01</span>
                    <h3 className="step-title">List</h3>
                    <p className="step-desc">Upload your premium pre-loved garments.</p>
                  </div>
                  <div className="step">
                    <span className="step-number">02</span>
                    <h3 className="step-title">Discover</h3>
                    <p className="step-desc">Find pieces you love from the community.</p>
                  </div>
                  <div className="step">
                    <span className="step-number">03</span>
                    <h3 className="step-title">Request</h3>
                    <p className="step-desc">Propose a fair exchange for the item.</p>
                  </div>
                  <div className="step">
                    <span className="step-number">04</span>
                    <h3 className="step-title">Swap</h3>
                    <p className="step-desc">Accept offers and refresh your wardrobe.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
