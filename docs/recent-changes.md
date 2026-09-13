# Recent Changes

This log tracks major structural, architectural, and design updates to the ReWear project.

## UI & Design Modernization (September 2026)
- **Global Typography & Density:** Modernized the application to feature a premium, editorial design. Reduced bloated padding, introduced `var(--font-display)`, and updated global border radii for a sleeker aesthetic.
- **Admin UI Polish:** Refined `/admin` routes to present a denser, highly scannable operational dashboard. 
- **Chat Experience:** Upgraded the `/chat` interface to function as a focused negotiation workspace. Fixed flex layout overflow clipping and introduced tapered message bubbles.
- **Form Components:** Standardized inputs, selects, and textareas with shared focus and disabled states across the application.

## Core Functional Fixes
- **Marketplace Filtering Resolution:** Fixed an issue where items featured in the homepage hero collage were unintentionally hidden from the standard "Explore the Marketplace" grids. Hero items are now discoverable in regular browsing.
- **Mobile Scroll Restoration:** Implemented a route-aware `<ScrollToTop>` component. Clicking listings from deep down on the homepage now correctly opens the Details page at the top (`y: 0`), while gracefully preserving the browser's native Back/Forward scroll restoration.

## Infrastructure
- Configured Vite as the frontend bundler replacing Create React App (CRA).
- Added `render.yaml` for streamlined Infrastructure-as-Code deployment.
- Integrated Vercel Web Analytics and Speed Insights packages.
