# Project Report — Clothing Exchange & Swap Marketplace

Unified Mentor Fullstack Web Development Internship

## Phase Status Overview

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project scaffolding (Express + MongoDB + React/Vite) | Complete |
| 2 | Authentication (register/login/logout, JWT httpOnly cookies) | Complete |
| 3 | Clothing Listings (CRUD, Cloudinary image upload, value estimator) | Complete |
| 4 | Swap Request System | Core workflow implemented and tested successfully (see below) |
| 5 | Chat / Negotiation | Not started |
| 6 | Location-Based Matching | Not started |
| 7 | Admin Panel | Not started |

## Phase 4 — Swap Request System

### Implementation Summary

The core swap request workflow has been implemented end-to-end across backend and frontend:

- `SwapRequest` model with a `pending → accepted → completed` primary path, plus `rejected` and `cancelled` side branches.
- Backend endpoints: `POST /api/swaps`, `GET /api/swaps/incoming`, `GET /api/swaps/sent`, `PATCH /api/swaps/:id/accept`, `PATCH /api/swaps/:id/reject`, `PATCH /api/swaps/:id/cancel`, `PATCH /api/swaps/:id/complete`.
- Server-side ownership and status enforcement on every mutation.
- Frontend: an enabled "Request Swap" flow on the Item Details page, and a Swap Requests page with Incoming/Sent tabs supporting Accept, Reject, Cancel, and Mark Complete actions.

**Note:** implementation of the full feature (including duplicate-request handling, conflict resolution, and authorization edge cases) is complete, but only the four core happy-path tests listed below have been explicitly confirmed through manual testing so far. Remaining test cases are listed as **Pending** until independently verified.

### Phase 4 Testing Table

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Create Swap Request | User A can send a swap request for User B's listing, offering one of their own listings; the request appears under User A's Sent requests with status Pending. | User A sent a swap request for User B's listing. The request appeared under User A's Sent requests with status Pending, as confirmed via the application UI. | Passed |
| Incoming Swap Request | User B, upon logging in, sees User A's request under their Incoming requests, with both the requested and offered items displayed correctly (titles, images, estimated values). | User B logged in and saw User A's request under Incoming. The requested item (Blue Shirt, Est. $18) and offered item (Suit, Est. $30) were displayed correctly. | Passed |
| Accept Swap Request | User B (owner of the requested listing) can accept a pending request; the request status transitions from Pending to Accepted. | User B accepted the pending request. The request status changed from Pending to Accepted, as confirmed via the application UI. | Passed |
| Complete Swap | An accepted swap request can be marked as complete; the request status transitions from Accepted to Completed. | The accepted swap was marked as complete. The request status changed from Accepted to Completed, as confirmed via the application UI. | Passed |
| Requesting own listing is blocked | Backend rejects a swap request where the requester owns the requested listing. | Not yet tested | Pending |
| Offering another user's listing is blocked | Backend rejects a swap request where the offered listing does not belong to the requester. | Not yet tested | Pending |
| Duplicate request handling | Backend rejects a duplicate active request for the same requester/requested/offered listing combination. | Not yet tested | Pending |
| Requesting unavailable listings is blocked | Backend rejects a swap request where the requested or offered listing is not in `available` status. | Not yet tested | Pending |
| Reject Swap Request | The requested listing's owner can reject a pending request; status transitions to Rejected. | Not yet tested | Pending |
| Cancel Swap Request | The original requester can cancel their own pending request; status transitions to Cancelled. | Not yet tested | Pending |
| Conflict handling on accept | When a request is accepted, other pending requests referencing either involved listing are automatically rejected. | Not yet tested | Pending |
| Unauthorized accept is blocked | A user who does not own the requested listing cannot accept the request. | Not yet tested | Pending |
| Unauthorized reject is blocked | A user who does not own the requested listing cannot reject the request. | Not yet tested | Pending |
| Unauthorized cancel is blocked | A user who is not the original requester cannot cancel the request. | Not yet tested | Pending |
| Completing a pending request is blocked | Only requests with status Accepted can be marked complete; a Pending request cannot be completed. | Not yet tested | Pending |
| Completing a rejected/cancelled request is blocked | A Rejected or Cancelled request cannot be marked complete. | Not yet tested | Pending |

### Evidence

The following screenshots from manual testing on `localhost:5173/swap-requests` support the four Passed test cases above:

1. **Sent request showing Pending** — User's Sent tab showing the swap request (Blue Shirt ⇄ Suit) with status "Pending".
2. **Incoming request showing Pending** — User B's Incoming tab showing the same request with status "Pending" and Accept/Reject actions available.
3. **Incoming request showing Accepted** — Same request with status "Accepted" and a "Mark Swap Complete" action available.
4. **Incoming request showing Completed** — Same request with status "Completed", confirming the full lifecycle from creation through completion.

## Notes

- This document reflects only the test cases explicitly confirmed by the project owner as of the date of this update. It does not claim that all Phase 4 functionality has been tested — remaining edge cases and security checks (listed as Pending above) still require manual verification before Phase 4 can be considered fully tested.
- No application code was modified as part of this documentation update.
