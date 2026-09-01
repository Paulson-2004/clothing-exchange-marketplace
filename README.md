# Clothing Exchange & Swap Marketplace

A sustainable clothing exchange platform where users list, browse, and swap clothing items without money changing hands.

**Status: Phase 6 — Swap Value Comparator (Complete)**

## Stack
- Frontend: React (Vite), React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Auth: JWT in httpOnly cookies, bcryptjs (Phase 2)
- Images: Cloudinary (Phase 3)
- Real-time Negotiation: REST polling chat (Phase 5)
- Valuation: Deterministic value estimator (Phase 3) & comparison utility (Phase 6)

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
| 7 | Location-Based Matching | **Not Started** | Planned (nearby & compatible value matching) |
| 8 | Admin Panel | **Not Started** | Planned (dashboard, content moderation, analytics) |

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

---

## Setup & Running

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` and fill in your values (`MONGO_URI`, `JWT_SECRET`, Cloudinary credentials, etc.).

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
npm run test:phase4     # Phase 4 Swap Request tests (20/20 confirmed)
npm run test:phase5     # Phase 5 Chat & Negotiation tests (20/20 passed)
npm run test:phase6     # Phase 6 Swap Value Comparator tests (43/43 passed)
```

---

## Upcoming Phases
- **Phase 7 — Location-Based Matching**: Show nearby swap opportunities and suggest compatible matches based on location (`city`, `state`) and estimated value (reusing Phase 6's `compareValues`). *(Not started)*
- **Phase 8 — Admin Panel**: Admin dashboard, user and listing management, content moderation, and basic activity analytics. *(Not started)*

