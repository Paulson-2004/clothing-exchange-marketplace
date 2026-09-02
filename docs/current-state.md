# Current State — Clothing Exchange & Swap Marketplace

A snapshot of the project **right now**. If anything here conflicts with `architecture.md`, `requirements.md`, or `implementation-plan.md`, this file should be treated as the most current — but all four were written/verified together against the same repository inspection, so they should agree. See §9 for the one known open question shared across all four docs.

---

## 1. What Currently Works

- Full authentication flow: register, login, logout, session-restore-on-refresh, protected routes.
- Full listing lifecycle: create (with real Cloudinary image upload), browse/search/filter, view details, edit (own only), delete (own only).
- Full swap request lifecycle: create → accept → complete, plus reject and cancel branches, with conflict auto-rejection when one request is accepted while others are still pending on the same listings.
- Full chat: start/reuse a conversation (optionally linked to a swap request), send/receive messages via 4-second REST polling, read/unread tracking, chat header shows linked swap status.
- Deterministic value estimator with a live "Suggest Value" button on the listing form; user can override the suggestion.
- Deterministic swap value comparator (`valueComparator.js`) with `GET /api/listings/compare`, calculating absolute difference, percentage difference, and fairness classification (`Close Match`, `Moderate Difference`, `Large Difference`), integrated into swap request preview and swap request cards.
- Location-based swap matching (`GET /api/listings/:id/matches`) with hierarchical location proximity (exact same city vs. same state), Phase 6 value compatibility reuse (`compareValues`), deterministic ranking, and "Nearby Swap Matches" section on `ItemDetailsPage.jsx`.
- Full Admin Panel (`/api/admin/*`, `/admin/*`):
  - Dashboard analytics (`GET /api/admin/stats` with aggregate counts across users, listings by status, swaps by status, and messages).
  - User management (paginated user list with search & role filter, user detail with activity summary, role toggle with self-demotion prevention).
  - Listing moderation (paginated list across all statuses, admin delete with active swap auto-rejection and partner listing restoration).
  - Swap activity monitoring (paginated read-only list across all users with status filter and populated requester/listing details).
  - Strict backend-authoritative security via `protect` + `requireAdmin` middleware chain.
- Five automated backend test suites (Phase 4: 20/20 passing, Phase 5: 20/20 passing, Phase 6: 43/43 passing, Phase 7: 32/32 passing, Phase 8: 46/46 passing, per actual reported runs — not assumed).

## 2. What Doesn't Work / Isn't Built

- **Real user dashboard**: `DashboardPage.jsx` is still a Phase 2 placeholder (name/email/role only).
- **No deployment setup**: no Dockerfile, no CI, no hosting-platform config of any kind exists yet.

## 3. What's Incomplete (partial implementations to be aware of)

- Swap "maintain swap history" — technically satisfied (completed/rejected/cancelled requests stay in MongoDB and remain visible in the Incoming/Sent lists), but there's no dedicated history view.
- Swap "confirm agreement via chat" — chat can display live swap status, but there's no chat-embedded confirm button; users still go to the Swap Requests page to Accept/Complete.
- Responsive design — some pages/components have explicit mobile handling (chat layout, item details, admin tables), not formally verified everywhere.
- Accessible contrast — not formally audited.

## 4. Current Known Bugs

None currently tracked/reported as open bugs. (This does not mean none exist — it means no bug has been reported and confirmed during development. Treat this as "no known bugs," not "no bugs.")

## 5. Current TODOs (explicit, in-code or in-doc)

- Cloudinary images are never deleted when a listing is deleted — documented limitation, not fixed, not currently scheduled.
- No pagination on public marketplace listings or messages — documented limitation, acceptable at current scale only (admin endpoints use server-side pagination).
- No MongoDB transactions around multi-document swap-accept writes — documented limitation, acceptable at current scale only.

## 6. Current Database State/Schema

Five Mongoose collections: `User`, `Listing`, `SwapRequest`, `Conversation`, `Message`. Full field-by-field schema detail is in `architecture.md` §4 — not repeated here to avoid the two documents drifting out of sync. No other collections exist. No pending/uncommitted schema migrations.

## 7. Current API State

Six route groups mounted: `/api/health`, `/api/auth`, `/api/listings`, `/api/swaps`, `/api/chat`, `/api/admin`. Full endpoint-by-endpoint list is in `architecture.md` §6. No `GET /api/swaps/:id` single-fetch endpoint (chat works around this via population instead of calling swap endpoints).

## 8. Current Frontend State

14 pages/routes in `App.jsx`: Home, Login, Register, Dashboard (placeholder), Item Details (with "Nearby Swap Matches" section for available items), Create/Edit Listing, My Listings, Swap Requests, Chat, Admin Dashboard, Admin Users, Admin User Detail, Admin Listings, Admin Swaps. All wrapped in a single `AuthProvider` + `BrowserRouter`. Admin routes protected by `<ProtectedRoute adminOnly>`.

## 9. Current Authentication State

Fully working: JWT in httpOnly cookie (`token`), 7-day expiry, `protect` middleware verified on every route that needs it, `requireAdmin` actively guards all `/api/admin/*` endpoints. Admin accounts can only be created via `npm run seed:admin` (manual, env-var driven, never automatic) or promoted via the admin user management panel.

## 10. Current Test Status

| Suite | Result | Source |
|---|---|---|
| Phase 4 automated (`npm run test:phase4`) | 20/20 passed, 0 failed | Actual reported run, recorded in `PROJECT_REPORT.md` |
| Phase 4 manual UI | 5/5 confirmed passed | Actual reported results, recorded in `PROJECT_REPORT.md` |
| Phase 5 automated (`npm run test:phase5`) | 20/20 passed, 0 failed | Actual reported run, recorded in `PROJECT_REPORT.md` |
| Phase 5 manual frontend verification | 11 specific behaviors confirmed | Actual reported results, recorded in `PROJECT_REPORT.md` — explicitly not a claim of exhaustive frontend testing |
| Phase 6 automated (`npm run test:phase6`) | 43/43 passed, 0 failed | Actual reported run, recorded in `PROJECT_REPORT.md` |
| Phase 7 automated (`npm run test:phase7`) | 32/32 passed, 0 failed | Actual reported run, recorded in `PROJECT_REPORT.md` |
| Phase 8 automated (`npm run test:phase8`) | 46/46 passed, 0 failed | Actual reported run, recorded in `PROJECT_REPORT.md` |

**No test has ever been marked "Passed" in this project without an actual reported result.** Continue that discipline — do not infer test outcomes from reading code.

## 11. Build / Run Commands

```bash
# Backend (from backend/)
npm install
npm run dev              # nodemon, http://localhost:5000
npm run seed:admin       # one-off, requires ADMIN_EMAIL/ADMIN_PASSWORD in .env
npm run test:phase4      # requires backend already running
npm run test:phase5      # requires backend already running
npm run test:phase6      # requires backend already running
npm run test:phase7      # requires backend already running
npm run test:phase8      # requires backend already running

# Frontend (from frontend/)
npm install
npm run dev               # vite, http://localhost:5173
npm run build              # production build
npm run preview            # preview the production build
```

## 12. Environment Variables / Configuration Needed

`backend/.env` (real file exists, git-ignored, contains working credentials — **do not overwrite, do not run `cp .env.example .env`**):
```
PORT, NODE_ENV, MONGO_URI, JWT_SECRET, CLIENT_URL,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
ADMIN_EMAIL, ADMIN_PASSWORD
```

`frontend/.env`:
```
VITE_API_BASE_URL
```

Both `.env.example` files in the repo document the shape/format without real values.

## 13. Last Completed Feature/Phase

**Phase 8 — Admin Panel.** Confirmed complete and tested: 46/46 automated backend integration tests passed. Built `adminController.js`, `adminRoutes.js` mounted at `/api/admin`, admin API client, dashboard stats, user management with role toggling and user detail activity summary, listing moderation with active swap auto-rejection, read-only swap monitoring, admin navigation and route gating via `<ProtectedRoute adminOnly>`, and full test suite. Recorded in `docs/PROJECT_REPORT.md`.

## 14. Exact Recommended Next Task

All 8 planned roadmap phases (Phases 1–8) are now **100% complete and tested**.
Recommended subsequent tasks:
1. Production deployment setup (Dockerfile, hosting on Render/Vercel or equivalent).
2. Optional polish: User Dashboard (`DashboardPage.jsx`) buildout from Phase 2 placeholder.

## 15. Anything an Incoming Agent Must Know Before Modifying the Project

- **Do not touch `backend/.env`.** It has real, working credentials. Only edit `.env.example` to document new variables.
- **Never run `cp .env.example .env`** — this is a standing project rule, stated explicitly multiple times during development, because it would destroy the real working config.
- **Do not reintroduce `multer-storage-cloudinary`** — it was deliberately removed due to an unresolvable peer-dependency conflict with `cloudinary@2.x`. Current image upload uses `multer.memoryStorage()` + `cloudinary.uploader.upload_stream` instead (see `backend/src/middleware/upload.js`).
- **Do not modify Phase 1–5 files unless a new feature genuinely requires it.** The established, successful pattern across every phase so far has been additive-only changes (new files + minimal, surgical edits to `app.js`/`App.jsx`/`Navbar.jsx` to mount/link new features) — this is why Phases 1–5 have all remained stable and fully tested through five rounds of subsequent work.
- **Every phase so far followed the same process**: inspect existing code → propose architecture (files, schema, endpoints) → wait for explicit confirmation → implement → provide a manual testing checklist → wait for actual reported results → only then update `PROJECT_REPORT.md`, and only with real results. Continue this process; do not skip the "wait for confirmation" or "wait for real results" steps.
- **`docs/PROJECT_REPORT.md` is the authoritative test-results record** for Phases 1–5 (evidence-based, transcribed from actual reported runs). These four architecture/requirements/plan/current-state documents are a *separate*, code-inspection-based set of documents for continuity purposes — they should never contradict `PROJECT_REPORT.md`'s recorded results, and if a discrepancy is ever found, `PROJECT_REPORT.md`'s actual recorded test results take precedence for anything testing-related, while these four documents take precedence for architecture/structure description (since `PROJECT_REPORT.md` is phase-narrative, not a structural reference).
