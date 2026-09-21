# Recent Changes

This log tracks major structural, architectural, and design updates to the ReWear project.

## UI & Design Modernization (September 2026)
- **Global Typography & Density:** Modernized the application to feature a premium, editorial design. Reduced bloated padding, introduced `var(--font-display)`, and updated global border radii for a sleeker aesthetic.
- **Admin UI Polish:** Refined `/admin` routes to present a denser, highly scannable operational dashboard. 
- **Chat Experience:** Upgraded the `/chat` interface to function as a focused negotiation workspace. Fixed flex layout overflow clipping and introduced tapered message bubbles.
- **Form Components:** Standardized inputs, selects, and textareas with shared focus and disabled states across the application.

## Marketplace Loading Performance Pass
- **Immediate Fetching:** The 350ms debounce is now applied only to free-text filters (search, city, state). The initial homepage load, category pills, size/condition selects, reset, and pagination request listings right away.
- **Stale Request Cancellation:** Superseded marketplace requests are aborted via `AbortController`, and clicking an already-active filter no longer repeats the same request.
- **Instant Back Navigation:** Recently loaded marketplace pages are kept in a short-lived in-memory cache (60s, per tab) and shown instantly when returning from an item page, then revalidated in the background so listing status stays accurate. Creating, editing, or deleting a listing clears the cache.
- **Parallel Item Details Requests:** The listing and its nearby swap matches are fetched at the same time instead of sequentially, and a late response for a previously opened item can no longer overwrite the item currently being viewed.
- **Smaller Card Images:** Unsplash-hosted demo images are requested at thumbnail width on listing cards (Cloudinary uploads already used transformations); the Item Details page keeps the full-size image. `preconnect` hints were added for both image CDNs.
- **Cold Starts Documented:** Render free-tier spin-down remains the cause of very slow first requests after idle periods; see [Deployment](deployment.md#performance-notes-render-free-tier-cold-starts).

## Core Functional Fixes
- **Marketplace Filtering Resolution:** Fixed an issue where items featured in the homepage hero collage were unintentionally hidden from the standard "Explore the Marketplace" grids. Hero items are now discoverable in regular browsing.
- **Mobile Scroll Restoration:** Implemented a route-aware `<ScrollToTop>` component. Clicking listings from deep down on the homepage now correctly opens the Details page at the top (`y: 0`), while gracefully preserving the browser's native Back/Forward scroll restoration.

## Infrastructure
- Configured Vite as the frontend bundler replacing Create React App (CRA).
- Added `render.yaml` for streamlined Infrastructure-as-Code deployment.
- Integrated Vercel Web Analytics and Speed Insights packages.
