# Implementation Plan — Clothing Exchange & Swap Marketplace

A practical roadmap for continuing development **from the current repository state**. This is not a history of how the project was built (see `docs/PROJECT_REPORT.md` for that) — it's a forward-looking plan for whoever picks this up next.

---

## 1. Completed Phases/Features (verified against repository, not assumed)

| # | Feature area | Status | Evidence |
|---|---|---|---|
| 1 | Project scaffolding (Express + MongoDB + React/Vite) | Complete | Full working `backend/`/`frontend/` split, both run via `npm run dev` |
| 2 | Authentication | Complete, tested | JWT httpOnly cookie flow, manually tested per `PROJECT_REPORT.md` |
| 3 | Clothing Listings (CRUD + Cloudinary + value estimator) | Complete, tested | Full CRUD, image upload working, manually tested |
| 4 | Swap Request System | Complete, tested | 20/20 tests passed (5 manual UI + 15 automated backend), see `PROJECT_REPORT.md` |
| 5 | Chat & Negotiation | Complete, tested | 20/20 automated backend tests passed + manual frontend verification, see `PROJECT_REPORT.md` |
| 6 | Swap Value Comparator | Complete, tested | 43/43 automated backend integration tests passed, see `PROJECT_REPORT.md` |

All six of the above are genuinely working, not just planned — verified by automated test suites against the live backend.

---

## 2. Phase 6 — Swap Value Comparator (Complete)

**Formalizing the swap value comparison logic.**

Status: **Complete and tested.**
- `backend/src/utils/valueComparator.js` & `frontend/src/utils/valueComparator.js` provide canonical `compareValues(valueA, valueB)`.
- `GET /api/listings/compare?listingA=<id>&listingB=<id>` endpoint added to `listingController.js` and `listingRoutes.js`.
- Inline diff logic in `RequestSwapForm.jsx` and `SwapRequestCard.jsx` replaced with shared `compareValues`.
- 43/43 automated integration tests passed in `backend/tests/phase6-value-comparator-tests.js`.

---

## 3. Remaining Phases

### Phase 7 — Location-Based Matching
**Not started. No code exists.**

Requirements (from `requirements.md` §1.7):
- Filter listings by location — **already partially done** (exact city/state filter exists in `GET /api/listings`); this phase is really about the two pieces that don't exist yet:
- Show nearby swap opportunities — not started
- Suggest potential matches based on location + compatible estimated value — not started

Recommended approach (not yet agreed/built, offered as a starting point only):
- No geocoding/external maps API per original project constraints ("Do NOT implement geocoding, GPS, or an external maps API... Location matching can prioritize same city, same state").
- A "matches" endpoint could reasonably live at something like `GET /api/listings/:id/matches` or `GET /api/matches`, computing candidate listings where `location.city`/`location.state` matches the target and `estimatedValue` falls within some tolerance — this would naturally reuse the comparison utility built in Phase 6, which is one reason to finish Phase 6 first.
- Needs its own explicit design/approval pass before implementation, per this project's established pattern (architecture proposal → wait for confirmation → implement).

### Phase 8 — Admin Panel
**Not started. Only foundational pieces exist** (`role` field, `requireAdmin` middleware, `seedAdmin.js`).

Requirements (from `requirements.md` §1.8): admin dashboard, view users, view listings, remove inappropriate listings, monitor swap activity, basic analytics, manage users.

Needs, at minimum:
- `backend/src/controllers/adminController.js` + `backend/src/routes/adminRoutes.js`, mounted at `/api/admin`, every route behind `protect` + `requireAdmin`.
- Endpoints likely needed: list users, list all listings (any status), delete/hide a listing, list all swap requests (for monitoring), some basic aggregate counts (users/listings/swaps by status) for "analytics."
- Frontend: an `AdminPage.jsx` (or split into sub-pages), gated by `<ProtectedRoute adminOnly>` — note `ProtectedRoute.jsx` **already supports** an `adminOnly` prop, unused so far; this is ready to consume.
- A way to actually log in as an admin for testing: run `npm run seed:admin` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set in `.env`.

### Unresolved smaller item — DashboardPage
Not tracked as its own numbered phase anywhere, but flagged here because it's an explicit gap against the original "8 required pages" spec: `DashboardPage.jsx` is still the Phase 2 placeholder. Building it out (e.g. summary of the user's own listings/incoming requests/unread messages) is a reasonable candidate to fold into whichever phase touches the dashboard next, or to do as a standalone small task. Not currently scheduled.

---

## 4. Dependencies Between Tasks

- **Phase 6 (Swap Value Comparator) is complete and unblocks Phase 7 (Location-Based Matching)**, whose "compatible estimated value" matching will reuse Phase 6's comparison logic (`compareValues`).
- **Phase 8 (Admin Panel) has no hard dependency** on Phases 6 or 7 — it could be built in parallel or before them. It only depends on infrastructure that already exists (`requireAdmin`, `role`, `ProtectedRoute`'s `adminOnly` prop).
- **No remaining phase requires touching Phases 1–5.** All prior work is additive-only by established project convention (see `architecture.md` §9, point 5 as the clearest example) — continue that pattern.

---

## 5. Recommended Implementation Order

1. **Phase 6 — Swap Value Comparator** — Complete and tested (43/43 automated backend integration tests passed).
2. **Phase 7 — Location-Based Matching** (Next phase) — needs its own architecture proposal + explicit sign-off before coding, per established project process.
3. **Phase 8 — Admin Panel** — can be done before or after Phase 7 without penalty; recommend after, purely to keep the "value/matching" conceptual thread together, but this is a preference, not a hard requirement.
4. **(Optional, unscheduled) Build out `DashboardPage.jsx`** into something real — low risk, no dependencies, could be slotted in anywhere.

---

## 6. Important Prerequisites for Any New Work

- **Do not modify `backend/.env`** — it contains real, working credentials (Mongo, JWT secret, Cloudinary, admin seed). Only `.env.example` should ever be edited to document new variables.
- **Do not run `cp .env.example .env`** — this has been an explicit standing instruction throughout the project and would destroy working config.
- **Preserve the established controller pattern**: `asyncHandler` wrapper, `res.status(xxx); throw new Error(...)` for errors, explicit ownership/participant checks via `.toString()` comparison, consistent `{success, ...}` response envelope.
- **Preserve the established frontend pattern**: API calls isolated in `src/api/*.js` files, pages in `pages/`, reusable UI in `components/<feature>/`, shared loading/empty/error components from `components/common/`.
- **Any new phase should get an explicit architecture proposal (files to create/modify, schema changes if any, new dependencies if any) before implementation**, and should wait for confirmation before writing code — this has been the consistent working pattern for every phase so far and should continue.
- **Never claim a test passed without an actual reported result.** This project has a strict evidence-based testing culture (see `PROJECT_REPORT.md`) — every "Passed" entry in that document corresponds to an actual reported test run, never an assumption from code review alone. Continue this discipline.

---

## 7. Testing Requirements for Future Work

Following the established pattern from Phases 4, 5, and 6:
- Any new backend feature should get a standalone test script under `backend/tests/` (e.g. `phase7-<feature>-tests.js`), using real HTTP requests against the locally running backend, disposable test users/data created via the real APIs or direct Mongoose seeding, full ID tracking, and cleanup of only the exact IDs that test run created.
- Manual UI testing checklist should be provided before implementation is marked tested, and results should only be recorded in `PROJECT_REPORT.md` after the project owner explicitly confirms them (not inferred from "the code looks correct").
- Regression check: before/after any new phase, a quick pass confirming Phases 1–6 still function (register/login, create/edit/delete a listing, full swap lifecycle, chat send/receive, value comparator) is good practice given how interconnected the data model is (Listings ↔ SwapRequests ↔ Conversations all reference each other).

---

## 8. Integration Requirements

- Any new feature that touches listings or swap requests should follow the Phase 5 precedent: **prefer read-only population over modifying existing controllers/models**, if the new feature only needs to *display* data from another domain (this is how chat integrated with swaps without touching `swapController.js`).
- If a genuinely new mutation on an existing model is unavoidable (e.g. an admin "remove listing" action does need to actually delete/modify a `Listing`), that's fine — but it should go through the existing model, not a duplicate/parallel one.

---

## 9. Deployment

**Not yet done. No deployment configuration exists in the repository** (no `Dockerfile`, no CI config, no platform-specific config like `render.yaml` or `vercel.json`). The original project brief mentions MongoDB Atlas (already in use for dev), Render or similar for the backend, and Vercel for the frontend, but none of that setup has been started. This is a "Needs verification" item for whoever picks up deployment — check current hosting provider documentation/limitations at the time rather than assuming anything about free-tier features, since this hasn't been touched yet and platform offerings change.
