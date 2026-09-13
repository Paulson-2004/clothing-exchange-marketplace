# Clothing Exchange & Swap Marketplace

A sustainable clothing exchange platform where users list, browse, and swap clothing items without money changing hands.

**Status: Complete (Phases 1–8 Implemented & Verified)**

## Stack
- Frontend: React (Vite), React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Auth: JWT in httpOnly cookies, bcryptjs (Phase 2)
- Images: Cloudinary (Phase 3)
- Real-time Negotiation: REST polling chat (Phase 5)
- Valuation & Matching: Deterministic value estimator (Phase 3), comparison utility (Phase 6), and location-based matching (Phase 7)
- Administration: Full admin panel with dashboard analytics, user management, listing moderation, and swap activity monitoring (Phase 8)

## Project Structure
```
clothing-exchange/
├── backend/     Express API & MongoDB models
├── frontend/    React (Vite) client
└── docs/        Persistent architectural & requirements documentation
```

## Phase Status Summary

| Phase | Feature Area | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Project Scaffolding | Complete | Working Express + MongoDB + React/Vite stack |
| 2 | Authentication | Complete | JWT httpOnly cookies, register/login/logout, protected routes |
| 3 | Clothing Listings / Marketplace | Complete | Full CRUD, Cloudinary upload, search/filter, value estimator |
| 4 | Swap Request System | Complete | Full state machine, 20/20 tests passed |
| 5 | Chat & Negotiation | Complete | Polling chat, swap-linked headers, 20/20 automated tests passed |
| 6 | Swap Value Comparator | Complete | Reusable comparator, GET /api/listings/compare, 43/43 tests passed |
| 7 | Location-Based Matching | Complete | Hierarchical proximity, value matching, GET /api/listings/:id/matches, 32/32 tests passed |
| 8 | Admin Panel | Complete | Dashboard stats, user management, listing moderation, swap monitoring, 46/46 tests passed |

---

## Completed Phases

### Phase 1 — Project Scaffolding
- Express server with MongoDB connection (`backend/`)
- `/api/health` endpoint reporting API + DB status
- Global error handling middleware
- CORS configured for frontend with credentials enabled
- React (Vite) app calling `/api/health` on load

### Phase 2 — Authentication
- `User` model with salted password hashing (`select: false`)
- Register, login, logout, and `/api/auth/me` endpoints
- JWT stored in httpOnly cookie
- `protect` auth middleware and `requireAdmin` middleware foundation
- Admin seed script (`npm run seed:admin`)
- Frontend `AuthContext` restoring session on page refresh via `/api/auth/me`
- `ProtectedRoute` component, auth-aware `Navbar`, Login and Register pages

### Phase 3 — Clothing Listings & Marketplace
- `Listing` model, full CRUD (`POST/GET/PUT/DELETE /api/listings`), server-side ownership enforcement
- Search + category, size, condition, city, and state filtering on `GET /api/listings`
- Cloudinary image upload via `multer` memory storage + `upload_stream` (up to 5 images)
- Deterministic swap value estimator (`utils/valueEstimator.js`) with live `GET /api/listings/estimate-value`
- Marketplace (`HomePage`), Item Details, Create/Edit Listing (with live image preview and value suggestion), and My Listings pages

### Phase 4 — Swap Request System
- `SwapRequest` model with complete state machine (`pending → accepted → completed`, `pending → rejected`, `pending → cancelled`)
- `POST /api/swaps`, `GET /api/swaps/incoming`, `GET /api/swaps/sent`, `PATCH /api/swaps/:id/{accept,reject,cancel,complete}`
- Ownership and availability enforcement on every mutation; duplicate-request prevention
- Automatic rejection of conflicting pending requests when one is accepted
- Frontend: enabled "Request Swap" flow on Item Details and Swap Requests page with Incoming/Sent tabs
- 20/20 confirmed tests passed (5 manual UI + 15 automated integration tests)

### Phase 5 — Chat & Negotiation
- `Conversation` and `Message` models with read/unread tracking and sorted participant indexing
- `GET/POST /api/chat/conversations`, `GET/POST /api/chat/conversations/:id/messages`, `PATCH /api/chat/conversations/:id/read`
- Participant authorization enforced on every message and conversation action
- Read-only swap linking: displays linked swap context and status badge in the chat header without altering the swap model
- 4-second REST polling with auto-cleanup in `MessageThread.jsx`
- Frontend: `ChatPage` with `ConversationList`, `MessageThread`, and `MessageInput`
- 20/20 automated backend integration tests passed

### Phase 6 — Swap Value Comparator
- Canonical value comparator utility (`backend/src/utils/valueComparator.js` & `frontend/src/utils/valueComparator.js`)
- Reuses Phase 3's deterministic `estimateValue` calculation without recreation
- Computes absolute difference, percentage difference, and deterministic fairness classifications:
  - $\le 20\%$ $\rightarrow$ `Close Match`
  - $\le 50\%$ $\rightarrow$ `Moderate Difference`
  - $> 50\%$ $\rightarrow$ `Large Difference`
  - Zero-value edge case handled gracefully ($0\%$ diff, `Close Match`) without division-by-zero
- Public read-only endpoint: `GET /api/listings/compare?listingA=<id>&listingB=<id>`
- Integrated into `RequestSwapForm.jsx` (live preview before sending) and `SwapRequestCard.jsx` (incoming & sent request cards)
- Informational only — zero authority over swap status transitions
- 43/43 automated backend integration tests passed

### Phase 7 — Location-Based Matching
- Deterministic hierarchical location matching (`exact` = same city + same state; `state` = same state only) without external geocoding/maps dependencies
- Direct reuse of Phase 6's `compareValues()` for value compatibility (`Close Match` and `Moderate Difference` included, `Large Difference` excluded)
- Simple deterministic ranking formula: `matchScore = locationScore + valueScore` (range 3–6), sorted by score desc $\rightarrow$ value difference asc $\rightarrow$ creation date desc
- Public read-only endpoint: `GET /api/listings/:id/matches?limit=N`
- Excludes source listing, own-owner listings, and non-available (pending/swapped) items
- Frontend integration: "Nearby Swap Matches" section on `ItemDetailsPage.jsx` with match reason badges, reusing `ListingCard`, `Loader`, `EmptyState`, and `ErrorMessage`
- 32/32 automated backend integration tests passed

### Phase 8 — Admin Panel
- Dedicated admin routes under `/api/admin` guarded by `protect` + `requireAdmin`
- Dashboard metrics (`GET /api/admin/stats`) aggregating users, listings, swaps, and messages
- User management (`GET /api/admin/users`, `GET /api/admin/users/:id`, `PATCH /api/admin/users/:id/role`) with search, role filters, activity summary, and self-demotion lockout
- Listing moderation (`GET /api/admin/listings`, `DELETE /api/admin/listings/:id`) across all statuses with active swap auto-rejection
- Read-only swap activity monitoring (`GET /api/admin/swaps`) with status filters
- Frontend: 5 admin pages, reusable table rows, modal confirmation, pagination, and `<ProtectedRoute adminOnly>` route gating
- 46/46 automated backend integration tests passed

### Compliance Improvements — Profile, Location Filter & Realistic Demo Data
- **Personal Profile & Dashboard**: Dedicated `ProfilePage.jsx` (`/profile`), protected `GET/PATCH/PUT /api/auth/profile`, activity summary metrics, recent swap history table, and enhanced `DashboardPage.jsx` overview
- **Explicit Marketplace Location Filtering**: Backend `GET /api/listings` supports `city`, `state`, and `location` filters with case-insensitive search; frontend `ListingFilters.jsx` provides interactive city & state inputs with live debounced search
- **Realistic Demo Data Seeder**: `backend/src/scripts/seedDemoData.js` (`npm run seed:demo`) seeds 5 realistic Indian users and 15 authentic clothing items (Nike, Levi's, Zara, H&M, Adidas, Uniqlo, FabIndia, Wildcraft, etc.)
- 17/17 automated backend integration tests passed

---

## Setup & Running

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` and fill in your values (`MONGO_URI`, `JWT_SECRET`, Cloudinary credentials, etc.).

Seed realistic demo data (optional):
```bash
npm run seed:demo
```

Run the server:
```bash
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` is set (default `http://localhost:5000/api`).

Run the client:
```bash
npm run dev
```

### 3. Automated Test Suites
Run test scripts from the `backend/` directory while the backend server is running:
```bash
npm run test:phase4            # Phase 4 Swap Request tests (15/15 passed)
npm run test:phase5            # Phase 5 Chat & Negotiation tests (20/20 passed)
npm run test:phase6            # Phase 6 Swap Value Comparator tests (43/43 passed)
npm run test:phase7            # Phase 7 Location-Based Matching tests (32/32 passed)
npm run test:phase8            # Phase 8 Admin Panel tests (46/46 passed)
npm run test:profile-location  # Profile & Location Filter tests (17/17 passed)
```


