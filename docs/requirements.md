# Requirements — Clothing Exchange & Swap Marketplace

Original context: Unified Mentor Fullstack Web Development Internship project. This document lists every requirement from the original project brief and states its **current, verified implementation status** based on inspecting the actual repository — not on what was planned or discussed.

Status legend: **Implemented** (working, present in code) / **Partially Implemented** (some part exists but is incomplete) / **Planned** (discussed but no code exists) / **Not Started**.

---

## 1. Core Functional Requirements

### 1.1 User Authentication — **Implemented**
- Register, login, logout — Implemented (`authController.js`, `authRoutes.js`)
- Protected routes (frontend) — Implemented (`ProtectedRoute.jsx`)
- Protected routes (backend) — Implemented (`protect` middleware)
- User profiles — **Partially Implemented**: `User` model has `name`, `email`, `location`; there is no dedicated profile view/edit page. `DashboardPage.jsx` shows name/email/role only, read-only.
- Secure password handling — Implemented (bcryptjs, salted hash, `select: false` on schema)
- User roles (user/admin) — **Partially Implemented**: the `role` field, `requireAdmin` middleware, and `seedAdmin.js` script all exist, but no route or UI actually checks/uses the admin role yet.

### 1.2 Clothing Listings — **Implemented**
- Create listing — Implemented
- Upload clothing image(s) — Implemented (Cloudinary, up to 5 images, 5MB each, JPG/PNG/WEBP only)
- Clothing type/category — Implemented (enum)
- Brand — Implemented
- Size — Implemented (enum)
- Condition — Implemented (enum)
- Description — Implemented (max 1000 chars)
- Estimated swap value — Implemented (see §3 Value Estimator)
- Location — Implemented (city/state/country strings)
- Availability status — Implemented (`available`/`pending`/`swapped`)
- Edit listing — Implemented (owner-only, partial updates supported)
- Delete listing — Implemented (owner-only)

### 1.3 Marketplace — **Implemented**
- Browse clothing listings — Implemented (`HomePage.jsx`)
- Search — Implemented (MongoDB text index on title+brand)
- Category filtering — Implemented
- Size filtering — Implemented
- Condition filtering — Implemented
- Location filtering — Implemented (exact city/state match, case-insensitive)
- Item detail page — Implemented (`ItemDetailsPage.jsx`)
- Display listing owner — Implemented

### 1.4 Swap Requests — **Implemented**
- Send swap request — Implemented
- Select one of the user's own listings as the offered item — Implemented (`RequestSwapForm.jsx`)
- View incoming requests — Implemented
- View sent requests — Implemented
- Accept request — Implemented
- Reject request — Implemented
- Track swap status — Implemented (`pending → accepted → completed`, or `→ rejected`/`→ cancelled`)
- Maintain swap history — **Partially Implemented**: all past `SwapRequest` documents persist in MongoDB with their final status, so a history technically exists, but there is no dedicated "history" view distinct from the Incoming/Sent tabs — completed/rejected/cancelled requests just remain visible in those same lists.
- Cancel request (requester, pending only) — Implemented
- Complete request (either party, accepted only) — Implemented
- Duplicate-request prevention — Implemented (same requester+requestedListing+offeredListing while active)
- Conflict auto-rejection on accept — Implemented

### 1.5 Negotiation / Chat — **Implemented**
- Conversation between two users — Implemented
- Send messages — Implemented
- Display message history — Implemented (chronological, up to 200 messages, no further pagination)
- Read/unread tracking — Implemented
- Allow users to confirm the swap agreement — **Partially Implemented**: chat can be linked to a swap request and displays its live status, but there is no in-chat "confirm agreement" action distinct from the existing swap Accept/Complete buttons on the Swap Requests page. Users negotiate in chat, then go complete the swap via the existing swap UI — there's no chat-embedded confirmation button.
- REST polling for near-real-time updates — Implemented (4-second interval)
- WebSockets/Socket.io — **Not Started** (explicitly deferred per project rules; code is structured to allow adding it later without a rewrite)

### 1.6 Swap Value Calculator — **Implemented**
- Estimate value based on category — Implemented (`valueEstimator.js`)
- Estimate value based on brand — Implemented (small hardcoded tier list + graceful fallback for unknown brands)
- Estimate value based on condition — Implemented
- Label result clearly as an estimate, not market price — Implemented (UI copy in `CreateEditListingPage.jsx`, `ItemDetailsPage.jsx`, `RequestSwapForm.jsx`)
- Compare estimated values between two items — Implemented (`valueComparator.js`, `GET /api/listings/compare`, integrated in `RequestSwapForm.jsx` and `SwapRequestCard.jsx` with absolute difference, percentage difference, and deterministic classifications `Close Match`, `Moderate Difference`, `Large Difference`)

### 1.7 Location-Based Matching — **Implemented**
- Store user/listing location — Implemented (plain `city`, `state`, `country` strings on `User` and `Listing`)
- Filter listings by location — Implemented (exact-match city/state filter on `GET /api/listings`)
- Show nearby swap opportunities — Implemented (`GET /api/listings/:id/matches`, hierarchical same city / same state proximity; "Nearby Swap Matches" section on `ItemDetailsPage.jsx`)
- Suggest potential matches based on location and compatible estimated value — Implemented (combines location tier scoring with Phase 6's `compareValues()` value compatibility scoring into deterministic ranking, excluding Large Difference)

### 1.8 Admin Panel — **Implemented**
- Admin dashboard — Implemented (`/admin`, `AdminDashboardPage.jsx`, `GET /api/admin/stats`)
- View users — Implemented (`/admin/users`, `AdminUsersPage.jsx`, `GET /api/admin/users`)
- View listings — Implemented (`/admin/listings`, `AdminListingsPage.jsx`, `GET /api/admin/listings`)
- Remove inappropriate listings — Implemented (`DELETE /api/admin/listings/:id` with cascade swap auto-rejection)
- Monitor swap activity — Implemented (`/admin/swaps`, `AdminSwapsPage.jsx`, `GET /api/admin/swaps`)
- Basic analytics — Implemented (`GET /api/admin/stats` with user, listing, swap, message aggregate counts)
- Manage users — Implemented (role toggling `PATCH /api/admin/users/:id/role`, user detail `GET /api/admin/users/:id` with activity summary)

---

## 2. Required Pages (original spec: 6–8 interconnected pages)

| # | Page | Status |
|---|---|---|
| 1 | Login / Register | Implemented (two separate pages: `LoginPage.jsx`, `RegisterPage.jsx`) |
| 2 | Home / Clothing Listings | Implemented (`HomePage.jsx`) |
| 3 | Item Details | Implemented (`ItemDetailsPage.jsx`) |
| 4 | Create/Edit Listing | Implemented (`CreateEditListingPage.jsx`, shared component) |
| 5 | Swap Requests | Implemented (`SwapRequestsPage.jsx`) |
| 6 | Chat | Implemented (`ChatPage.jsx`) |
| 7 | User Dashboard | **Partially Implemented** — page exists and is routed, but is still the minimal Phase 2 placeholder (name/email/role only) |
| 8 | Admin Panel | Implemented (`AdminDashboardPage.jsx`, `AdminUsersPage.jsx`, `AdminUserDetailPage.jsx`, `AdminListingsPage.jsx`, `AdminSwapsPage.jsx`) |

Additionally implemented but not in the original 6–8 list: `MyListingsPage.jsx` (a practical necessity for listing management, reasonably considered part of "User Dashboard" territory but built as its own route).

---

## 3. Non-Functional Requirements

| Requirement | Status | Notes |
|---|---|---|
| Responsive/mobile-friendly design | **Partially Implemented** | Media queries exist for the chat layout, item details grid, and swap filters; not every page/component has been explicitly verified across breakpoints. |
| Form validation | Implemented | Both frontend (inline, fast feedback) and backend (authoritative) on every form-backed endpoint. |
| Error handling | Implemented | Centralized `errorHandler.js` backend-side; `ErrorMessage.jsx` + try/catch patterns frontend-side. |
| Loading states | Implemented | `Loader.jsx` used consistently across pages. |
| Empty states | Implemented | `EmptyState.jsx` used consistently. |
| Secure authentication | Implemented | See Security Requirements below. |
| Clean UI | Implemented (subjective) | Consistent design tokens, card-based layout, no unstyled/default browser UI. |
| Maintainable code | Implemented (subjective) | Consistent patterns across controllers (asyncHandler, explicit status+throw), consistent frontend structure (api/components/pages separation). |
| Reasonable component structure | Implemented | Feature-based folders (`listing/`, `swap/`, `chat/`), shared `common/` components. |
| Good API architecture | Implemented | RESTful, consistent response envelope, consistent auth middleware usage. |
| No hardcoded fake functionality | Implemented | No mocked endpoints; every button that appears functional actually calls a real API. |

---

## 4. Security Requirements

| Requirement | Status | Notes |
|---|---|---|
| JWT not stored in localStorage | Implemented | httpOnly cookie only. |
| httpOnly cookies | Implemented | |
| CORS configured for credentials | Implemented | Locked to `CLIENT_URL`, `credentials: true`. |
| Secure cookie settings for dev | Implemented | `secure: false` in dev, `true` in production (tied to `NODE_ENV`). |
| `JWT_SECRET` via env var | Implemented | |
| `JWT_SECRET` never exposed to frontend | Implemented | Backend-only, never in any API response. |
| Password hashes never returned | Implemented | `select: false` on schema + explicit `toSafeUser()` mapping in `authController.js`. |
| Backend input validation (not just frontend) | Implemented | Every mutating endpoint re-validates on the backend regardless of frontend checks. |
| First registered user is NOT auto-admin | Implemented | `role` never taken from `req.body`; always defaults to `'user'`. |
| Ownership enforced server-side (listings) | Implemented | |
| Ownership/participant enforced server-side (swaps) | Implemented | |
| Ownership/participant enforced server-side (chat) | Implemented | |
| Backend authoritative for stored listing values | Implemented | `estimatedValue` is validated server-side (numeric, non-negative) regardless of what the frontend sends; the estimator is only a fallback/suggestion, never bypassable to store invalid data. |
| Cloudinary credentials never exposed to frontend | Implemented | |

---

## 5. UI/UX Requirements

| Requirement | Status |
|---|---|
| Modern, clean sustainable-fashion marketplace feel | Implemented (subjective design judgment) |
| Clean typography | Implemented |
| Modern cards | Implemented (`listing-card`, `swap-request-card`, message bubbles) |
| Attractive clothing imagery | Implemented (real Cloudinary-hosted images, no placeholder/lorem-ipsum images used in the UI itself — though seed/test data uses placeholder URLs, see `current-state.md`) |
| Clear CTA buttons | Implemented |
| Responsive navigation | **Partially Implemented** — `Navbar.jsx` exists and is styled but a mobile hamburger/collapse pattern has not been explicitly verified. |
| Consistent spacing | Implemented (CSS custom properties + consistent class patterns) |
| Subtle animations | **Partially Implemented** — hover states and transform-on-hover exist on cards; no broader animation system. |
| Accessible contrast | **Partially Implemented** — not formally audited against WCAG; color choices appear reasonable but this is unverified. |
| Professional empty/loading/error states | Implemented |

---

## 6. API / Backend Requirements

| Requirement | Status |
|---|---|
| REST APIs between React and Express | Implemented |
| Environment variables for secrets/config | Implemented |
| No secrets in frontend code | Implemented |
| Backend input validation | Implemented |
| Consistent error responses | Implemented |
| Feature/domain-organized controllers and routes | Implemented |

---

## 7. Database Requirements

| Requirement | Status |
|---|---|
| MongoDB via Mongoose | Implemented |
| Schema validation (enums, required fields, max lengths) | Implemented |
| Indexes for common query patterns | Implemented (see `architecture.md` §4 for the full list) |
| No unnecessary/speculative fields | Implemented — schemas contain only fields actually used by the current feature set. |

---

## 8. Explicitly Out of Scope for the Current Phase Set (per original + subsequent instructions)

These were explicitly deferred by project rules at various points and remain untouched:
- TypeScript
- Java/Spring Boot
- Next.js
- Socket.io / WebSockets
- Any AI/ML-based value estimation (the estimator is, and must remain, a deterministic formula)

---

## 9. Phase Numbering — Resolved

The phase-numbering question previously flagged here has been explicitly resolved by the project owner. The approved roadmap is:

- **Phase 6 — Swap Value Comparator**: Formalizing the existing value-comparison functionality described in §1.6 — centralized comparison utility, percentage difference, fairness classification with deterministic thresholds. **Complete and tested (43/43 tests passed).**
- **Phase 7 — Location-Based Matching**: Nearby swap opportunities and value-compatible suggestions described in §1.7 — deterministic location tiers, value compatibility via Phase 6 reuse, `GET /api/listings/:id/matches`, and "Nearby Swap Matches" section on Item Details. **Complete and tested (32/32 tests passed).**
- **Phase 8 — Admin Panel**: Full admin dashboard, user/listing management, analytics described in §1.8. **Complete and tested (46/46 tests passed).**

