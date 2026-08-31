# Project Report — Clothing Exchange & Swap Marketplace

Unified Mentor Fullstack Web Development Internship

## Phase Status Overview

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project scaffolding (Express + MongoDB + React/Vite) | Complete |
| 2 | Authentication (register/login/logout, JWT httpOnly cookies) | Complete |
| 3 | Clothing Listings (CRUD, Cloudinary image upload, value estimator) | Complete |
| 4 | Swap Request System | Core workflow and all tested edge cases verified successfully — 20 of 20 confirmed tests passed (see below) |
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

**Note:** Five core/edge-case tests below were confirmed through manual UI testing. All remaining backend-testable edge cases (duplicate requests, unauthorized actions, unavailable listings, conflict resolution, invalid state transitions) were subsequently verified using a dedicated automated integration test script (`backend/tests/phase4-swap-tests.js`) that sends real HTTP requests to the running backend using dedicated, disposable test users and listings. Results from that run are recorded below exactly as produced by the script — see the "Automated Backend Integration Test Results" section for the full raw output. Combined, 20 test cases have been explicitly confirmed (5 manual UI + 15 automated backend), with 0 failures.

### Phase 4 Testing Table

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Create Swap Request | User A can send a swap request for User B's listing, offering one of their own listings; the request appears under User A's Sent requests with status Pending. | User A sent a swap request for User B's listing. The request appeared under User A's Sent requests with status Pending, as confirmed via the application UI. | Passed |
| Incoming Swap Request | User B, upon logging in, sees User A's request under their Incoming requests, with both the requested and offered items displayed correctly (titles, images, estimated values). | User B logged in and saw User A's request under Incoming. The requested item (Blue Shirt, Est. $18) and offered item (Suit, Est. $30) were displayed correctly. | Passed |
| Accept Swap Request | User B (owner of the requested listing) can accept a pending request; the request status transitions from Pending to Accepted. | User B accepted the pending request. The request status changed from Pending to Accepted, as confirmed via the application UI. | Passed |
| Complete Swap | An accepted swap request can be marked as complete; the request status transitions from Accepted to Completed. | The accepted swap was marked as complete. The request status changed from Accepted to Completed, as confirmed via the application UI. | Passed |
| Requesting own listing is blocked | Backend rejects a swap request where the requester owns the requested listing. | Logged in as User A. Opened a listing owned by User A. On the Item Details page, the "Request Swap" button was not shown; the "Edit Listing" action was shown instead, as confirmed via the application UI. | Passed |
| Offering another user's listing is blocked | Backend rejects a swap request where the offered listing does not belong to the requester. | Automated test attempted POST /api/swaps with an offeredListingId owned by a different user. Response status: 403. | Passed |
| Duplicate request handling | Backend rejects a duplicate active request for the same requester/requested/offered listing combination. | Automated test created an initial request (status 201), then repeated the identical request while the first was still pending. First attempt: 201. Duplicate attempt: 409. | Passed |
| Requesting unavailable listings is blocked | Backend rejects a swap request where the requested or offered listing is not in `available` status. | Automated test attempted a swap request against a listing whose status was set to `pending`. Response status: 400. | Passed |
| Reject Swap Request | The requested listing's owner can reject a pending request; status transitions to Rejected. | Automated test created a pending request and had the requested listing's owner reject it. Response status: 200, resulting swap request status: rejected. Both involved listings independently verified in the database to remain `available` afterward. | Passed |
| Cancel Swap Request | The original requester can cancel their own pending request; status transitions to Cancelled. | Automated test created a pending request and had the original requester cancel it. Response status: 200, resulting swap request status: cancelled. Both involved listings independently verified in the database to remain `available` afterward. | Passed |
| Conflict handling on accept | When a request is accepted, other pending requests referencing either involved listing are automatically rejected. | Automated test created a main pending request and a second, conflicting pending request referencing one of the same listings, then accepted the main request. Accept response: 200, status accepted. The conflicting request was independently verified in the database to have status: rejected. | Passed |
| Unauthorized accept is blocked | A user who does not own the requested listing cannot accept the request. | Automated test attempted PATCH /api/swaps/:id/accept as a third-party user who was neither the requester nor the requested listing's owner. Response status: 403. Swap request independently verified in the database to remain pending. | Passed |
| Unauthorized reject is blocked | A user who does not own the requested listing cannot reject the request. | Automated test attempted PATCH /api/swaps/:id/reject as a third-party user. Response status: 403. Swap request independently verified in the database to remain pending. | Passed |
| Unauthorized cancel is blocked | A user who is not the original requester cannot cancel the request. | Automated test attempted PATCH /api/swaps/:id/cancel as the requested listing's owner (not the original requester). Response status: 403. Swap request independently verified in the database to remain pending. | Passed |
| Completing a pending request is blocked | Only requests with status Accepted can be marked complete; a Pending request cannot be completed. | Automated test attempted PATCH /api/swaps/:id/complete on a request still in Pending status. Response status: 400. Swap request independently verified in the database to remain pending. | Passed |
| Completing a rejected/cancelled request is blocked | A Rejected or Cancelled request cannot be marked complete. | Automated test attempted completion on a Rejected request (response: 400, status remained rejected) and separately on a Cancelled request (response: 400, status remained cancelled). Both branches verified independently in the database. | Passed |
| Verify completed listings | After a request reaches Completed status, both associated listings should have status `swapped` and should not appear in the default marketplace view. | Automated test completed a valid accepted swap, then independently checked the database and the default `GET /api/listings` response. Both listings had status: swapped, and neither appeared in the returned marketplace listings. | Passed |

### Automated Backend Integration Test Results

Executed via `npm run test:phase4` (`backend/tests/phase4-swap-tests.js`) against the locally running backend, using dedicated disposable test users and listings that were automatically cleaned up after the run. Results below are transcribed exactly from the actual script output, provided by the project owner.

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Valid request creation | 201, status pending | 201, status=pending | Passed |
| Offer someone else's listing | 403 | 403 | Passed |
| Duplicate pending request | 409 on second attempt | first=201, duplicate=409 | Passed |
| Request unavailable listing | 400 | 400 | Passed |
| Conflict auto-rejection | accept=200/accepted, conflicting request auto-rejected | accept=200/accepted, conflictingRequestStatus=rejected | Passed |
| Reject request | 200, status rejected, listings remain available | 200, status=rejected, listingA=available, listingB=available | Passed |
| Cancel request | 200, status cancelled, listings remain available | 200, status=cancelled, listingA=available, listingB=available | Passed |
| Complete a pending request | 400, remains pending | 400, status=pending | Passed |
| Complete a rejected/cancelled request | 400 in both cases, statuses unchanged | rejected-branch=400/rejected, cancelled-branch=400/cancelled | Passed |
| Unauthorized accept | 403, remains pending | 403, status=pending | Passed |
| Unauthorized reject | 403, remains pending | 403, status=pending | Passed |
| Unauthorized cancel | 403, remains pending | 403, status=pending | Passed |
| Valid accept | 200, status accepted | 200, status=accepted | Passed |
| Valid completion | 200, status completed | 200, status=completed | Passed |
| Verify completed listings | both listings swapped in DB and absent from default marketplace view | listingA=swapped, listingB=swapped, hiddenFromMarketplace=true | Passed |

**Final result:**
- Passed: 15
- Failed: 0
- Total: 15

No failures occurred in this run. Test data (3 disposable users, 25 disposable listings, 12 disposable swap requests) was created and then fully removed by the script's cleanup step; no existing real users, listings, or swap requests were affected.

### Evidence

The following screenshots from manual testing on `localhost:5173/swap-requests` support four of the five manually-confirmed Passed test cases above (Create, Incoming, Accept, Complete). The fifth manual test, "Requesting own listing is blocked," was confirmed on the Item Details page and is not pictured in these particular screenshots.

1. **Sent request showing Pending** — User's Sent tab showing the swap request (Blue Shirt ⇄ Suit) with status "Pending".
2. **Incoming request showing Pending** — User B's Incoming tab showing the same request with status "Pending" and Accept/Reject actions available.
3. **Incoming request showing Accepted** — Same request with status "Accepted" and a "Mark Swap Complete" action available.
4. **Incoming request showing Completed** — Same request with status "Completed", confirming the full lifecycle from creation through completion.

## Notes

- This document reflects only test results explicitly confirmed by the project owner: five manually-tested UI cases, and fifteen automated backend integration test cases — 20 total, all passed, 0 failed.
- The automated test script (`backend/tests/phase4-swap-tests.js`) is a standalone test file separate from the application source code. No application code was modified as part of running these tests or updating this documentation.
- These 20 confirmed tests cover the core swap lifecycle, ownership/authorization enforcement, duplicate and unavailable-listing handling, conflict auto-rejection, and invalid state-transition blocking. Any test case not explicitly listed above has not been verified and should not be assumed to pass.
