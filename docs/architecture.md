# Architecture — Clothing Exchange & Swap Marketplace

This document describes the architecture **as it actually exists in the repository today**. It does not describe planned or aspirational architecture — see `requirements.md` and `implementation-plan.md` for what's still to come.

Last verified against repository contents: current session (Phases 1–8 fully implemented and tested).

---

## 1. High-Level Overview

```
┌──────────────────┐   REST/JSON    ┌───────────────────┐   Mongoose   ┌─────────────┐
│  React (Vite)     │ <-----------> │  Express (Node.js) │ <----------> │ MongoDB      │
│  frontend/         │  JWT httpOnly │  backend/           │              │ (Atlas)      │
└──────────────────┘   cookie       └───────────────────┘              └─────────────┘
                                              │
                                              ▼
                                   ┌────────────────────┐
                                   │ Cloudinary (images)  │
                                   │ config/cloudinary.js │
                                   │ + middleware/upload.js│
                                   └────────────────────┘
```

Two independent Node/npm projects live side by side in the repo root: `backend/` (Express API) and `frontend/` (Vite + React SPA). They communicate only over HTTP; there is no shared code, no monorepo tooling, and no server-side rendering.

---

## 2. Technologies and Dependencies

### Backend (`backend/package.json`)
- **Runtime**: Node.js (CommonJS modules, `"type": "commonjs"`)
- **Framework**: Express 4.19
- **Database/ODM**: MongoDB via Mongoose 8.5
- **Auth**: `jsonwebtoken` 9.x (JWT), `bcryptjs` 2.x (password hashing), `cookie-parser` 1.x
- **File upload**: `multer` 1.4.5-lts.1 (memory storage only — no disk writes)
- **Image hosting**: `cloudinary` 2.4 (official SDK, `upload_stream` API)
- **CORS**: `cors` 2.8
- **Env vars**: `dotenv` 16.x
- **Dev-only**: `nodemon` 3.x
- **No TypeScript. No Socket.io. No admin-specific packages.**

### Frontend (`frontend/package.json`)
- **Build tool**: Vite 5.3 + `@vitejs/plugin-react` 4.3
- **Framework**: React 18.3, `react-dom` 18.3
- **Routing**: `react-router-dom` 6.25
- **HTTP client**: `axios` 1.7
- **No state management library** (React Context + local `useState`/`useEffect` only)
- **No component library** (all UI is hand-rolled CSS in a single `index.css`)
- **No TypeScript.**

### External services
- **MongoDB Atlas** — the database. Connection string lives in `backend/.env` (`MONGO_URI`), not committed.
- **Cloudinary** — image hosting for listing photos. Credentials in `backend/.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), never exposed to the frontend.

---

## 3. Project Structure

```
clothing-exchange/
├── README.md
├── docs/
│   ├── PROJECT_REPORT.md        (phase-by-phase test results, evidence-based)
│   ├── architecture.md          (this file)
│   ├── requirements.md
│   ├── implementation-plan.md
│   └── current-state.md
├── backend/
│   ├── server.js                 entry point: loads env, connects DB, starts Express
│   ├── package.json
│   ├── .env                      NOT committed — real secrets (git-ignored)
│   ├── .env.example               documents required vars, no real values
│   ├── src/
│   │   ├── app.js                 Express app: middleware + route mounting + error handlers
│   │   ├── config/
│   │   │   ├── db.js               mongoose.connect() wrapper
│   │   │   └── cloudinary.js       cloudinary SDK config (isolated, only consumer is middleware/upload.js)
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Listing.js
│   │   │   ├── SwapRequest.js
│   │   │   ├── Conversation.js
│   │   │   └── Message.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── listingController.js
│   │   │   ├── swapController.js
│   │   │   ├── chatController.js
│   │   │   └── adminController.js
│   │   ├── routes/
│   │   │   ├── healthRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── listingRoutes.js
│   │   │   ├── swapRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   protect + requireAdmin
│   │   │   ├── errorHandler.js     notFound + centralized errorHandler
│   │   │   └── upload.js           multer memoryStorage + uploadBufferToCloudinary helper
│   │   ├── utils/
│   │   │   ├── asyncHandler.js     wraps async route handlers, forwards errors to next()
│   │   │   ├── generateToken.js    signs a JWT {id, role}
│   │   │   ├── valueEstimator.js   deterministic swap-value formula
│   │   │   └── valueComparator.js  deterministic value comparison & classification formula (Phase 6)
│   │   └── scripts/
│   │       ├── seedAdmin.js        manual, one-off admin-account creation (npm run seed:admin)
│   │       └── seedDemoData.js     realistic demo clothing data seeder (npm run seed:demo)
│   └── tests/
│       ├── phase4-swap-tests.js    standalone integration test script (real HTTP calls)
│       ├── phase5-chat-tests.js    standalone integration test script (real HTTP calls)
│       ├── phase6-value-comparator-tests.js standalone integration test script (real HTTP calls)
│       ├── phase7-location-matching-tests.js standalone integration test script (real HTTP calls)
│       ├── phase8-admin-panel-tests.js standalone integration test script (real HTTP calls)
│       └── profile-and-location-tests.js standalone integration test script (real HTTP calls)
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env                        NOT committed
    ├── .env.example
    └── src/
        ├── main.jsx                 ReactDOM.createRoot entry point
        ├── App.jsx                  BrowserRouter + route table, wraps everything in AuthProvider
        ├── index.css                single global stylesheet for the whole app
        ├── context/
        │   └── AuthContext.jsx      auth state, register/login/logout, session restore on refresh
        ├── utils/
        │   └── valueComparator.js   mirrors backend comparison formula for synchronous UI display
        ├── api/
        │   ├── axiosClient.js       shared axios instance (withCredentials: true)
        │   ├── authApi.js
        │   ├── listingApi.js
        │   ├── swapApi.js
        │   ├── chatApi.js
        │   └── adminApi.js
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.jsx
        │   │   └── ProtectedRoute.jsx
        │   ├── common/
        │   │   ├── Loader.jsx
        │   │   ├── EmptyState.jsx
        │   │   ├── ErrorMessage.jsx
        │   │   ├── Pagination.jsx
        │   │   └── ConfirmModal.jsx
        │   ├── listing/
        │   │   ├── ListingCard.jsx
        │   │   ├── ListingFilters.jsx
        │   │   └── ImageUploadPreview.jsx
        │   ├── swap/
        │   │   ├── SwapRequestCard.jsx
        │   │   └── RequestSwapForm.jsx
        │   ├── chat/
        │   │   ├── ConversationList.jsx
        │   │   ├── MessageThread.jsx
        │   │   └── MessageInput.jsx
        │   └── admin/
        │       ├── StatsCard.jsx
        │       ├── AdminUserRow.jsx
        │       ├── AdminListingRow.jsx
        │       └── AdminSwapRow.jsx
        └── pages/
            ├── HomePage.jsx              marketplace / browse listings (public)
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx         member dashboard overview + quick actions
            ├── ProfilePage.jsx           personal profile view/edit & swap history (/profile)
            ├── ItemDetailsPage.jsx
            ├── CreateEditListingPage.jsx  shared component for both create and edit
            ├── MyListingsPage.jsx
            ├── SwapRequestsPage.jsx
            ├── ChatPage.jsx
            ├── AdminDashboardPage.jsx
            ├── AdminUsersPage.jsx
            ├── AdminUserDetailPage.jsx
            ├── AdminListingsPage.jsx
            └── AdminSwapsPage.jsx
```

There is no `frontend/src/hooks/` content beyond an empty `.gitkeep` — no custom hooks currently exist. There is no `backend/src/models` file for anything beyond the five listed above (no Admin-specific model; admin uses the existing `User.role` field).

---

## 4. Database / Data Model

MongoDB via Mongoose. Five collections exist. All schemas use `{ timestamps: true }` (adds `createdAt`/`updatedAt` automatically).

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required, trimmed, max 80 |
| email | String | required, unique, lowercase, regex-validated |
| passwordHash | String | required, `select: false` (never returned by default queries) |
| role | String | enum `['user','admin']`, default `'user'` |
| phone | String | optional, trimmed contact number, default `''` |
| bio | String | optional, trimmed bio/preferences, max 300, default `''` |
| location | `{city, state, country}` | all optional strings, default `''` |

### Listing
| Field | Type | Notes |
|---|---|---|
| owner | ObjectId ref User | required, indexed |
| title | String | required, max 100 |
| category | String | enum: tops, bottoms, dresses, outerwear, footwear, accessories, activewear, other |
| brand | String | required, max 60 |
| size | String | enum: XS, S, M, L, XL, XXL, One Size |
| condition | String | enum: new, like-new, good, fair |
| description | String | required, max 1000 |
| images | [String] | Cloudinary secure URLs; custom validator requires length > 0 |
| estimatedValue | Number | required, min 0, max 10000 |
| location | `{city, state, country}` | |
| status | String | enum: available, pending, swapped — default `available` |

Text index on `{title, brand}` supports marketplace search. Statics `CATEGORIES`, `SIZES`, `CONDITIONS`, `STATUSES` expose the enums for reuse in controllers.

### SwapRequest
| Field | Type | Notes |
|---|---|---|
| requester | ObjectId ref User | required |
| requestedListing | ObjectId ref Listing | required |
| offeredListing | ObjectId ref Listing | required |
| status | String | enum: pending, accepted, rejected, completed, cancelled — default `pending` |

Indexes on `{requester,status}`, `{requestedListing,status}`, `{offeredListing,status}`. Statics `STATUSES` and `ACTIVE_STATUSES` (`['pending','accepted']`, used for duplicate-request detection).

### Conversation
| Field | Type | Notes |
|---|---|---|
| participants | [ObjectId ref User] | required, custom validator enforces exactly 2, always stored **sorted by ID string** |
| relatedSwapRequest | ObjectId ref SwapRequest | optional, default `null` |
| lastMessageAt | Date | default `Date.now`, used to sort the conversation list |

Indexes on `{participants}` and `{participants, relatedSwapRequest}`. The sorted-participants convention is a deliberate design decision (see §9) that lets an exact-array MongoDB query reliably detect an existing conversation between the same two people regardless of who initiates.

### Message
| Field | Type | Notes |
|---|---|---|
| conversation | ObjectId ref Conversation | required |
| sender | ObjectId ref User | required |
| text | String | required, trimmed, max 2000 chars (`Message.MAX_MESSAGE_LENGTH` static) |
| readBy | [ObjectId ref User] | default `[]`; sender is added immediately on send |

Index on `{conversation, createdAt}` for chronological retrieval.

**No other collections exist.** There is no Admin-specific collection, no notifications collection, no "SavedSearch" or "Favorites" collection, nothing for location-matching beyond the plain `city`/`state`/`country` strings already on `User` and `Listing`.

---

## 5. Authentication / Authorization

- **Mechanism**: JWT signed with `JWT_SECRET`, containing only `{ id, role }`, 7-day expiry (`generateToken.js`).
- **Transport**: httpOnly cookie named `token`. Never stored in `localStorage`/`sessionStorage`. `secure` flag is `true` only when `NODE_ENV === 'production'`; `sameSite: 'lax'`.
- **Middleware** (`authMiddleware.js`):
  - `protect` — reads `req.cookies.token`, verifies JWT, loads the full `User` document into `req.user`. 401 on missing/invalid/expired token or deleted user.
  - `requireAdmin` — runs after `protect`; checks `req.user.role === 'admin'`, 403 otherwise. Actively guards all `/api/admin/*` routes.
- **CORS**: locked to `process.env.CLIENT_URL`, `credentials: true` (required for the cookie to be sent cross-port in dev).
- **Frontend session restore**: `AuthContext.jsx` calls `GET /api/auth/me` once on mount; this is the only mechanism for restoring login state after a page refresh (no client-side token storage to read from).
- **Password hashing**: bcryptjs, salt rounds 10, on both registration and the `seedAdmin.js` script.
- **Role assignment**: `role` is **never** accepted from the client on registration — it always defaults to `'user'`. Admin accounts can be seeded via `npm run seed:admin` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars set, or promoted/demoted by existing admins through the `/api/admin/users/:id/role` endpoint (with self-demotion prevention).
- **Authorization pattern used everywhere else**: no roles/permissions library — every controller does explicit `doc.owner.toString() === req.user._id.toString()` (or equivalent participant/party checks) and throws a 403 via `res.status(403); throw new Error(...)`, caught by `asyncHandler` and formatted by the central `errorHandler`.

---

## 6. API Structure

All routes are mounted under `/api` in `backend/src/app.js`, in this exact order:

```
/api/health    → healthRoutes      (public)
/api/auth      → authRoutes
/api/listings  → listingRoutes
/api/swaps     → swapRoutes
/api/chat      → chatRoutes
/api/admin     → adminRoutes       (protect + requireAdmin)
```

### Auth (`/api/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /register | public | sets cookie, 201 |
| POST | /login | public | sets cookie, 200 |
| POST | /logout | public (intentionally not `protect`-gated) | clears cookie |
| GET | /me | protected | returns current user |
| GET | /profile | protected | returns safe user + activity statistics + recent swap history |
| PATCH | /profile | protected | updates name, phone, bio, location; protected fields immutable |
| PUT | /profile | protected | alias to PATCH /profile |

### Listings (`/api/listings`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | / | public | query params: search, category, size, condition, city, state, status (default `available`) |
| GET | /mine/all | protected | must be defined before `/:id` in Express |
| GET | /estimate-value | public | `?category=&brand=&condition=` → `{estimatedValue}` |
| GET | /compare | public | `?listingA=&listingB=` → `{listingA, listingB, comparison}` (Phase 6) |
| GET | /:id/matches | public | `?limit=N` → `{sourceListing, matches, count}` (Phase 7) |
| POST | / | protected | `multipart/form-data`, up to 5 images |
| GET | /:id | public | |
| PUT | /:id | protected + owner-only | partial update, appends new images rather than replacing |
| DELETE | /:id | protected + owner-only | |

### Swaps (`/api/swaps`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | / | protected | create request |
| GET | /incoming | protected | requests where caller owns the requested listing |
| GET | /sent | protected | requests the caller created |
| PATCH | /:id/accept | protected, requestedListing-owner only | |
| PATCH | /:id/reject | protected, requestedListing-owner only | |
| PATCH | /:id/cancel | protected, requester only | |
| PATCH | /:id/complete | protected, requester OR requestedListing-owner | |

**No `GET /api/swaps/:id` single-fetch endpoint exists.** The chat feature works around this by populating swap-request info directly inside `chatController.js` rather than calling a swap endpoint.

### Chat (`/api/chat`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /conversations | protected | caller's conversations, with otherParticipant/latestMessage/unreadCount |
| POST | /conversations | protected | create-or-find; optional `swapRequestId` |
| GET | /conversations/:id/messages | protected, participant-only | up to 200 messages, chronological, no real pagination |
| POST | /conversations/:id/messages | protected, participant-only | |
| PATCH | /conversations/:id/read | protected, participant-only | marks other party's messages read for caller |

### Admin (`/api/admin`) — All routes require `protect` + `requireAdmin` (Phase 8)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /stats | admin | Aggregate statistics: user counts, listing counts by status, swap counts by status, message count |
| GET | /users | admin | Server-side paginated list of users with `search` (name/email) and `role` filter |
| GET | /users/:id | admin | User details with activity summary counts (listings, swaps, messages) |
| PATCH | /users/:id/role | admin | Toggle user role (`user` ↔ `admin`); self-demotion blocked |
| GET | /listings | admin | Server-side paginated list of all listings across all statuses with search, status, and category filters |
| DELETE | /listings/:id | admin | Delete any listing; auto-rejects/cancels active swaps referencing it and restores partner listing |
| GET | /swaps | admin | Read-only server-side paginated list of all swap requests with status filter |

### Response conventions
All JSON responses use `{ success: boolean, ...payload }`. Errors: `{ success: false, message, stack? }` (stack included only outside production). Status codes are set explicitly before throwing (`res.status(xxx); throw new Error(...)`), caught by `asyncHandler`, formatted by `errorHandler.js`. Multer errors get a special-cased 400 (otherwise they'd default to 500).

---

## 7. Frontend Architecture

- **Routing**: single `BrowserRouter` in `App.jsx`, `ProtectedRoute` wrapper redirects unauthenticated users to `/login` (waits for `AuthContext`'s `initializing` flag before deciding, to avoid a false redirect flash on page refresh). Admin routes specify `adminOnly` prop which redirects non-admin users to `/`.
- **State management**: no Redux/Zustand/etc. `AuthContext` (React Context) is the only global state — user identity, `isAuthenticated`, `initializing`, `loading`, `error`, plus `register`/`login`/`logout` functions. Everything else is local component state via `useState`/`useEffect`.
- **API layer**: one `axiosClient` instance (`withCredentials: true`, `baseURL` from `VITE_API_BASE_URL`) — all feature-specific API files (`listingApi.js`, `swapApi.js`, `chatApi.js`, `adminApi.js`) wrap it; components never call axios directly.
- **Component conventions**: pages live in `pages/`, reusable pieces in `components/<feature>/`, and shared "state" components (`Loader`, `EmptyState`, `ErrorMessage`, `Pagination`, `ConfirmModal`) live in `components/common/` and are reused across every feature area.
- **Forms**: no form library — plain controlled `useState` objects, manual validation functions, inline error state.
- **Styling**: one hand-written `index.css` using CSS custom properties (`--color-primary`, etc.) for a small design-token system. No CSS-in-JS, no Tailwind, no component library.
- **Image upload UX**: `ImageUploadPreview.jsx` builds local `URL.createObjectURL` previews client-side; actual upload happens via `FormData` POST/PUT to the listings endpoints (multipart), never a separate "upload" endpoint.

---

## 8. Communication Pattern

- Frontend → Backend: REST over HTTP, JSON bodies (or `multipart/form-data` for listing create/edit), cookie-based auth automatically attached by the browser (`withCredentials: true`).
- **No WebSockets, no Socket.io, no SSE.** Real-time-feeling chat is achieved purely via **REST polling**: `MessageThread.jsx` runs a `setInterval` (4000ms) calling `GET /conversations/:id/messages` while a conversation is open, guarded by an `isFetchingRef` to prevent overlapping requests, and cleared on conversation switch / component unmount via the effect's cleanup function.
- Backend → MongoDB: Mongoose ODM, no raw driver usage, no aggregation pipelines currently in use (all queries are `find`/`findOne`/`findById`/`updateMany`/`countDocuments` with plain filters).
- Backend → Cloudinary: `cloudinary.uploader.upload_stream`, given an in-memory `Buffer` from multer (no temp files written to backend disk at any point).

---

## 9. Important Technical Decisions Already Made

These were explicit, reasoned choices during development — a future agent should not "fix" these without understanding why they exist:

1. **JWT in httpOnly cookie, not localStorage.** Security decision to prevent XSS token theft; means the frontend has no direct access to the token and must call `/api/auth/me` to check session state.
2. **`multer.memoryStorage()` + Cloudinary `upload_stream`, not `multer-storage-cloudinary`.** The latter package pins to Cloudinary SDK 1.x and created an unresolvable peer-dependency conflict with the installed `cloudinary@2.x`. This was a mid-project pivot (see `docs/PROJECT_REPORT.md` history) — do not reintroduce `multer-storage-cloudinary`.
3. **Estimated value is a suggestion, not an authority.** `GET /api/listings/estimate-value` computes a number the frontend can pre-fill, but the user can override it before submitting, and the backend never forces the computed value onto a listing — it only falls back to the formula if the client sends an unusable number. This was a deliberate product decision (documented in-code in `valueEstimator.js`).
4. **Conversation participants always stored sorted by ID string.** Enables an exact-array-match Mongo query (`{participants: [idA, idB]}`) to reliably find an existing conversation regardless of who initiates, without extra `$or` logic.
5. **Chat integrates with swaps via read-only population, not by modifying `SwapRequest`/`swapController`/`swapRoutes`.** `chatController.js` populates `relatedSwapRequest` (and its nested listings) when returning conversation data. This was explicitly done to guarantee zero risk to the already-tested Phase 4 swap logic.
6. **No `GET /api/swaps/:id` endpoint was added** — deliberately avoided so Phase 4's swap files could remain completely untouched during Phase 5.
7. **Swap `complete` action is single-sided** (either party can mark it complete without the other's confirmation) — intentional for the current phase; a mutual-confirmation flow was noted as a natural fit for chat but not built.
8. **No pagination on `GET /api/listings` or message retrieval** — a fixed message cap (200) and an unbounded listings query are used instead. Server-side pagination is used for admin endpoints (`/api/admin/users`, `/api/admin/listings`, `/api/admin/swaps`).
9. **REST polling instead of Socket.io for chat** — explicit phase requirement, not a technical limitation. Code is structured (isolated `useEffect` in `MessageThread.jsx`) so a future swap to Socket.io would only require changing that one function.
10. **Admin Panel is secured at the backend boundary via `protect` + `requireAdmin`** — Phase 8 created full admin controllers and routes under `/api/admin`, server-side pagination, and frontend views gated by `ProtectedRoute` with `adminOnly`.
11. **Location-based matching is deterministic and hierarchical (Phase 7)** — compares `city`/`state` directly without external geocoding/maps dependencies; reuses Phase 6's `compareValues()` for value compatibility.

---

## 10. Configuration / Environment Requirements

### `backend/.env` (see `.env.example` for the template — never overwrite the real `.env`)
```
PORT=5000
NODE_ENV=development
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<long random string>
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme123
```

### `frontend/.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Run commands
```bash
# Backend
cd backend && npm install && npm run dev      # nodemon, port 5000

# Frontend
cd frontend && npm install && npm run dev     # vite, port 5173

# One-off admin creation (manual, not automatic)
cd backend && npm run seed:admin

# Demo realistic clothing data seeder
cd backend && npm run seed:demo

# Automated test suites (require the backend already running)
cd backend && npm run test:phase4
cd backend && npm run test:phase5
cd backend && npm run test:phase6
cd backend && npm run test:phase7
cd backend && npm run test:phase8
cd backend && npm run test:profile-location
```

### Production Deployment Architecture
- **Backend (Render)**:
  - Runtime: Node.js (Web Service)
  - Root directory: `backend`
  - Build command: `npm install`
  - Start command: `node server.js`
  - Health check path: `/api/health`
  - Environment variables: `NODE_ENV=production`, `PORT=5000`, `CLIENT_URL=https://<your-vercel-app>.vercel.app`, `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- **Frontend (Vercel)**:
  - Framework Preset: `Vite`
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - SPA Rewrites: Configured via `frontend/vercel.json` (`rewrites: [{"source": "/(.*)", "destination": "/index.html"}]`)
  - Environment variables: `VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api`

---

## 11. Known Architectural Limitations / Technical Debt

- **No real pagination on public listings** — marketplace search and messages return all results / capped at 200 (admin endpoints have server-side pagination). Acceptable at current scale, will need addressing before production scale.
- **No transactions** around multi-document writes that should be atomic (e.g. `swapController.acceptSwapRequest` updates a SwapRequest + two Listings + potentially many conflicting SwapRequests across four separate `save()`/`updateMany()` calls with no Mongo session/transaction wrapping). Acceptable at single-instance dev scale; a documented risk at higher concurrency.
- **Cloudinary images are never deleted** when a listing is deleted (`deleteListing` only removes the MongoDB document) — orphaned images accumulate in the Cloudinary account over time. Known, documented, not fixed.
- **`DashboardPage.jsx` is still the Phase 2 placeholder** — shows only name/email/role, never built into a real dashboard despite being one of the 8 originally-specified pages.
- **No `GET /api/swaps/:id`** — anything needing a single swap request by ID (beyond what chat's read-only population already covers) will need a new endpoint.
