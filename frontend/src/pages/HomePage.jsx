import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getListings, getCachedListings } from '../api/listingApi';
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

// Only these filters are typed character-by-character, so only they need
// debouncing. Pills, selects, reset, pagination and the initial load fetch
// immediately.
const TEXT_FILTER_KEYS = ['search', 'city', 'state'];
const TEXT_DEBOUNCE_MS = 350;
const PAGE_SIZE = 24;

function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  // If the default marketplace page was loaded recently (e.g. the user is
  // coming back from an item page), paint it on the very first render so
  // there is no spinner flash. It is revalidated by the fetch effect below.
  const [initialCached] = useState(() =>
    getCachedListings({ ...initialFilters, page: 1, limit: PAGE_SIZE })
  );
  const [listings, setListings] = useState(initialCached?.listings || []);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialCached?.totalPages || 1);
  const [status, setStatus] = useState(initialCached ? 'success' : 'loading'); // 'loading' | 'success' | 'error'
  
  // RACE CONDITION PREVENTION:
  // If the user types fast, multiple API requests fire in parallel.
  // requestIdRef increments on every search. When a request finishes,
  // we check if its ID matches the current ID. If it doesn't, we ignore the
  // stale data. mountedRef prevents setting state if the user navigates away.
  // abortRef additionally cancels the superseded request so it stops using
  // a browser connection slot.
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const debounceNextFetchRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const fetchListings = useCallback(async (activeFilters, requestedPage = 1, requestId) => {
    if (!mountedRef.current || requestId !== requestIdRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = { ...activeFilters, page: requestedPage, limit: PAGE_SIZE };

    // STALE-WHILE-REVALIDATE:
    // If this exact page was loaded recently (e.g. the user is coming back
    // from an item page), show it immediately instead of a spinner, then
    // refresh it from the API so status changes still show up promptly.
    const cached = getCachedListings(params);
    if (cached) {
      setListings(cached.listings);
      setPage(cached.page || requestedPage);
      setTotalPages(cached.totalPages || 1);
      setStatus('success');
    } else {
      setStatus('loading');
    }

    try {
      const data = await getListings(params, { signal: controller.signal });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setListings(data.listings);
      setPage(data.page || requestedPage);
      setTotalPages(data.totalPages || 1);
      setStatus('success');
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      // Keep the cached page on screen if the background refresh fails.
      if (!cached) setStatus('error');
    }
  }, []);

  // FETCH ON FILTER / PAGE CHANGE:
  // Free-text edits wait 350ms after the user stops typing so we don't send
  // a request per keystroke. Every other trigger (initial load, category
  // pills, selects, reset, pagination) fetches right away.
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const delay = debounceNextFetchRef.current ? TEXT_DEBOUNCE_MS : 0;
    debounceNextFetchRef.current = false;
    const timeout = setTimeout(() => {
      fetchListings(filters, page, requestId);
    }, delay);
    return () => {
      clearTimeout(timeout);
      // Invalidate any in-flight request from this effect, including on unmount.
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [filters, page, fetchListings]);

  const handleFiltersChange = (nextFilters) => {
    const changedKeys = Object.keys(nextFilters).filter((key) => nextFilters[key] !== filters[key]);
    // Clicking an already-active option would only repeat the same request.
    if (changedKeys.length === 0 && page === 1) return;

    debounceNextFetchRef.current = changedKeys.some(
      (key) => TEXT_FILTER_KEYS.includes(key) && nextFilters[key] !== ''
    );
    setPage(1);
    setFilters(nextFilters);
  };

  const isDefaultView = page === 1 && Object.values(filters).every(v => v === '' || v == null);
  const availableListings = listings.filter(l => l.status === 'available');
  
  const latestItems = [];
  
  // HOMEPAGE LAYOUT SPLIT:
  // If the user is on the default view (no search, no filters, page 1), we
  // visually pull the first 4 newest items into a featured "Latest on ReWear" section,
  // and put the rest in the standard marketplace grid. If they are actively searching
  // or filtering, we abandon the split and show everything in a single grid.
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
        <div className="editorial-hero-workflow">
          <h2 className="hero-workflow-title">How ReWear Works</h2>
          <div className="hero-workflow-steps">
            <div className="hero-workflow-step">
              <span className="hero-step-number">01</span>
              <div className="hero-step-content">
                <h3 className="hero-step-title">List</h3>
                <p className="hero-step-desc">Upload your premium pre-loved garments.</p>
              </div>
            </div>
            <div className="hero-workflow-step">
              <span className="hero-step-number">02</span>
              <div className="hero-step-content">
                <h3 className="hero-step-title">Discover</h3>
                <p className="hero-step-desc">Find pieces you love from the community.</p>
              </div>
            </div>
            <div className="hero-workflow-step">
              <span className="hero-step-number">03</span>
              <div className="hero-step-content">
                <h3 className="hero-step-title">Request</h3>
                <p className="hero-step-desc">Propose a fair exchange for the item.</p>
              </div>
            </div>
            <div className="hero-workflow-step">
              <span className="hero-step-number">04</span>
              <div className="hero-step-content">
                <h3 className="hero-step-title">Swap</h3>
                <p className="hero-step-desc">Accept offers and refresh your wardrobe.</p>
              </div>
            </div>
          </div>
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
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
