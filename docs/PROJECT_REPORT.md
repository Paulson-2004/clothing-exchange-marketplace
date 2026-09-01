# Project Report — Clothing Exchange & Swap Marketplace

Unified Mentor Fullstack Web Development Internship

## Phase Status Overview

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project scaffolding (Express + MongoDB + React/Vite) | Complete |
| 2 | Authentication (register/login/logout, JWT httpOnly cookies) | Complete |
| 3 | Clothing Listings (CRUD, Cloudinary image upload, value estimator) | Complete |
| 4 | Swap Request System | Core workflow and all tested edge cases verified successfully — 20 of 20 confirmed tests passed (see below) |
| 5 | Chat / Negotiation | Implemented and tested successfully — 20 of 20 automated backend tests passed, plus manual frontend verification (see below) |
| 6 | Swap Value Comparator | Complete — 43 of 43 automated integration tests passed (see below) |
| 7 | Location-Based Matching | Complete — 32 of 32 automated integration tests passed (see below) |
| 8 | Admin Panel | Not started |

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

## Phase 5 — Chat & Negotiation

**Status: Implemented and tested successfully.**

Testing was completed in two parts: 20 automated backend integration tests (all passed) via `backend/tests/phase5-chat-tests.js`, and manual verification of the frontend chat UI. Both are recorded below exactly as reported by the project owner.

### Implementation Summary

A REST-polling-based chat system has been implemented, allowing any two users to negotiate directly, optionally tied to a specific swap request:

- **`Conversation` model**: exactly two participants (stored in a sorted order to reliably detect duplicates), an optional `relatedSwapRequest` reference, and `lastMessageAt` for sorting the conversation list.
- **`Message` model**: `conversation`, `sender`, `text` (required, trimmed, max 2000 characters), and `readBy` (array of user references) for the read/unread system.
- **Endpoints**: `GET /api/chat/conversations`, `POST /api/chat/conversations`, `GET /api/chat/conversations/:id/messages`, `POST /api/chat/conversations/:id/messages`, `PATCH /api/chat/conversations/:id/read` — all protected by the existing, unmodified `protect` middleware.
- **Authorization**: every conversation/message operation verifies the requesting user is one of the conversation's two participants (403 otherwise); creating a conversation linked to a swap request verifies the user is one of that swap's two parties (403 otherwise).
- **REST polling**: `MessageThread.jsx` polls `GET .../messages` every 4 seconds only while a conversation is open, guarded against overlapping requests, and the interval is cleared on conversation switch and component unmount (no Socket.io/WebSockets used, per the phase requirements).
- **Swap integration**: no changes were made to `SwapRequest.js`, `swapController.js`, or `swapRoutes.js`. The chat controller instead performs a read-only population of `relatedSwapRequest` (including the linked requested/offered listings and swap status) when returning conversation data, so the chat UI can display swap context without the swap system itself being touched. "Open Negotiation" was added to `SwapRequestCard.jsx` and "Message Seller" to `ItemDetailsPage.jsx` as entry points.
- **Frontend**: `ChatPage.jsx` (route `/chat`) with `ConversationList.jsx`, `MessageThread.jsx`, and `MessageInput.jsx`, using the existing `Loader`/`EmptyState`/`ErrorMessage` common components and the existing visual style (message bubbles, status badges, responsive two-column desktop layout that collapses to a single column on mobile).

### Files Created

- `backend/src/models/Conversation.js`
- `backend/src/models/Message.js`
- `backend/src/controllers/chatController.js`
- `backend/src/routes/chatRoutes.js`
- `backend/tests/phase5-chat-tests.js`
- `frontend/src/api/chatApi.js`
- `frontend/src/components/chat/ConversationList.jsx`
- `frontend/src/components/chat/MessageThread.jsx`
- `frontend/src/components/chat/MessageInput.jsx`
- `frontend/src/pages/ChatPage.jsx`

### Files Modified

- `backend/src/app.js` — mounted `/api/chat` routes (one new `require`, one new `app.use`)
- `backend/package.json` — added `test:phase5` script (no new dependencies)
- `frontend/src/App.jsx` — added `/chat` route
- `frontend/src/components/layout/Navbar.jsx` — added "Chat" link
- `frontend/src/components/swap/SwapRequestCard.jsx` — added "Open Negotiation" button
- `frontend/src/pages/ItemDetailsPage.jsx` — added "Message Seller" button
- `frontend/src/index.css` — appended chat-related styles

No existing Phase 1–4 files were rewritten; all Phase 4 files (`SwapRequest.js`, `swapController.js`, `swapRoutes.js`) remain exactly as they were.

### Automated Backend Integration Test Results

Executed via `npm run test:phase5` (`backend/tests/phase5-chat-tests.js`) against the locally running backend, using dedicated disposable test users, listings, and a swap request that were automatically cleaned up after the run. Results below are transcribed exactly as reported by the project owner.

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Unauthenticated access blocked | 401 | 401 | Passed |
| Self-conversation blocked | 400 | 400 | Passed |
| Invalid otherUserId format | 400 | 400 | Passed |
| Nonexistent otherUserId | 404 | 404 | Passed |
| Create conversation | 201, otherParticipant is User B | 201, otherParticipant was User B | Passed |
| Existing conversation reused | 200, same conversation ID | 200, existing conversation was reused | Passed |
| Send message | 201, message saved with correct text | 201, text="Hello, is this still available?" | Passed |
| Empty message rejected | 400 | 400 | Passed |
| Excessively long message rejected | 400 | 400 | Passed |
| Multiple messages in chronological order | 200, messages sorted oldest-first | 200, count=2, chronological=true | Passed |
| Invalid conversation ID format | 400 | 400 | Passed |
| Unauthorized read access blocked | 403 | 403 | Passed |
| Unauthorized send blocked | 403 | 403 | Passed |
| Unread count clears after marking read | unread > 0 before, 200 on mark-read, unread = 0 afterward | before=1, markReadStatus=200, after=0 | Passed |
| Unauthorized mark-read blocked | 403 | 403 | Passed |
| Conversation with swap request (valid party) | 201, relatedSwapRequest linked correctly | 201, relatedSwapRequest was linked correctly | Passed |
| Swap-linked conversation blocks uninvolved party | 403 | 403 | Passed |
| Invalid swapRequestId format | 400 | 400 | Passed |
| Nonexistent swapRequestId | 404 | 404 | Passed |
| Conversation list summary is correct | 200, correct other participant and latest message | 200, correct other participant and latestMessageText="Yes, still available!" | Passed |

**Final result:**
- Passed: 20
- Failed: 0
- Total: 20

No failures occurred in this run. Test data (3 disposable users, 2 disposable listings, 1 disposable swap request, 2 disposable conversations, 2 disposable messages) was created and then fully removed by the script's cleanup step; no existing real users, listings, swap requests, conversations, or messages were affected.

### Frontend Manual Verification

The following behaviors were manually observed by the project owner while exercising the chat UI between two real users:

- Chat page loads successfully.
- The conversation appears in the conversation list.
- Messages can be sent.
- Messages appear in the conversation.
- Incoming/outgoing message alignment works correctly.
- The conversation preview updates.
- Timestamps are displayed.
- The message input and Send button work.
- The swap-linked conversation displays the related swap information in the chat header.
- The swap status is displayed in the chat header.
- The tested conversation showed the completed swap and its related items ("Blue Shirt" ↔ "Suit").

This list reflects only the behaviors explicitly confirmed by the project owner. It is not a claim that every possible frontend scenario (e.g. live polling delivery timing, mobile responsive layout, empty/error states, unread-indicator styling) has been manually verified — those remain unconfirmed unless separately reported.

## Phase 6 — Swap Value Comparator

### Implementation Summary

Phase 6 formalizes, consolidates, and enhances the swap value comparison functionality:

- **Reused Existing Estimator**: Reuses the deterministic `estimateValue` formula in `backend/src/utils/valueEstimator.js` (`baseValue × brandMultiplier × conditionMultiplier`) from Phase 3 without recreation or alteration.
- **Canonical Comparator Utility**: Created `backend/src/utils/valueComparator.js` (and mirrored in `frontend/src/utils/valueComparator.js`) as a pure, deterministic calculation engine.
  - Formula:
    $$\text{percentageDifference} = \left( \frac{|\text{valueA} - \text{valueB}|}{\max(\text{valueA}, \text{valueB})} \right) \times 100$$
  - Thresholds:
    - $\le 20\%$ $\rightarrow$ `Close Match`
    - $\le 50\%$ $\rightarrow$ `Moderate Difference`
    - $> 50\%$ $\rightarrow$ `Large Difference`
  - Division-by-zero edge case: When both values are $0$, returns $0\%$ difference and classification `Close Match`.
- **Backend Read-Only Endpoint**: Added `GET /api/listings/compare?listingA=<id>&listingB=<id>` in `listingController.js` and `listingRoutes.js`. Validates parameter presence, ObjectId formatting, distinct IDs, and existence of both listings. Purely read-only; does not alter listing status or swap requests.
- **Frontend Integration**:
  - `RequestSwapForm.jsx`: Replaced duplicated inline difference subtraction with `compareValues()`. Displays requested item estimated value, offered item estimated value, absolute difference, percentage difference, and fairness classification badge, along with explicit advisory copy that values are estimates for negotiation guidance.
  - `SwapRequestCard.jsx`: Replaced duplicated inline difference subtraction with `compareValues()`. Displays requested and offered item values, difference with percentage, and classification badge.
  - `listingApi.js`: Added `compareListings(listingAId, listingBId)` export for programmatic backend comparisons.
- **State Machine Protection**: The comparator is strictly informational and has zero authority over swap status transitions (`pending → accepted`, `pending → rejected`, `accepted → completed`, `pending → cancelled`).

### Phase 6 Automated Integration Test Results

A dedicated automated test script (`backend/tests/phase6-value-comparator-tests.js`) was executed against the running backend with real HTTP requests and MongoDB fixtures with tracked cleanup.

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| estimate-value: known category+brand+condition | 200 | 200 | Passed |
| estimate-value: response has estimatedValue number | number | number | Passed |
| estimate-value: deterministic output | positive number | true | Passed |
| estimate-value: unknown brand fallback | 200 | 200 | Passed |
| estimate-value: unknown brand returns positive value | true | true | Passed |
| estimate-value: same inputs produce same output | equal | equal (33) | Passed |
| estimate-value: new condition > fair condition | true | true | Passed |
| compare: missing both params | 400 | 400 | Passed |
| compare: missing listingB | 400 | 400 | Passed |
| compare: invalid ObjectId | 400 | 400 | Passed |
| compare: same ID for both | 400 | 400 | Passed |
| compare: non-existent listingA | 404 | 404 | Passed |
| compare: valid request status | 200 | 200 | Passed |
| compare: response has success:true | true | true | Passed |
| compare: response has listingA | true | true | Passed |
| compare: response has listingB | true | true | Passed |
| compare: response has comparison object | true | true | Passed |
| compare: comparison.valueA is a number | number | number | Passed |
| compare: comparison.valueB is a number | number | number | Passed |
| compare: comparison.absoluteDifference is a number | number | number | Passed |
| compare: comparison.percentageDifference is a number | number | number | Passed |
| compare: comparison.classification is a string | string | string | Passed |
| compare: absoluteDifference matches \|valueA - valueB\| | 40 | 40 | Passed |
| classify: equal values -> absoluteDifference = 0 | 0 | 0 | Passed |
| classify: equal values -> percentageDifference = 0 | 0 | 0 | Passed |
| classify: equal values -> Close Match | Close Match | Close Match | Passed |
| classify: 100 vs 115 -> absoluteDifference = 15 | 15 | 15 | Passed |
| classify: 100 vs 115 -> percentageDifference correct | 13 | 13 | Passed |
| classify: 100 vs 115 -> Close Match (<=20%) | Close Match | Close Match | Passed |
| classify: 100 vs 125 -> exactly 20% -> Close Match (boundary inclusive) | Close Match | Close Match | Passed |
| classify: 100 vs 127 -> >20% -> Moderate Difference | Moderate Difference | Moderate Difference | Passed |
| classify: 100 vs 175 -> ~42.9% -> Moderate Difference | Moderate Difference | Moderate Difference | Passed |
| classify: 100 vs 200 -> exactly 50% -> Moderate Difference (boundary inclusive) | Moderate Difference | Moderate Difference | Passed |
| classify: 100 vs 205 -> >50% -> Large Difference | Large Difference | Large Difference | Passed |
| classify: 50 vs 500 -> 90% -> Large Difference | Large Difference | Large Difference | Passed |
| classify: both 0 -> no error, 200 | 200 | 200 | Passed |
| classify: both 0 -> absoluteDifference = 0 | 0 | 0 | Passed |
| classify: both 0 -> percentageDifference = 0 (no div-by-zero) | 0 | 0 | Passed |
| classify: both 0 -> Close Match | Close Match | Close Match | Passed |
| compare: accessible without auth (public endpoint) | 200 | 200 | Passed |
| compare: POST not allowed (not a write endpoint) | non-200 | true | Passed |
| compare: does not alter listing status | available | available | Passed |
| regression: swap creation still works after Phase 6 | 201 | 201 | Passed |

**Final result:**
- Passed: 43
- Failed: 0
- Total: 43

No failures occurred in this run. Test data (3 test users, 14 test listings, 1 test swap request) was created and then fully removed by the script's cleanup step; no existing real data was affected.

## Phase 7 — Location-Based Matching

### Implementation Summary

Phase 7 implements deterministic, read-only location proximity and estimated-value matching for swap suggestions:

- **Location Matching Tiers**:
  - `exact` (Same city): same city AND same state (case-insensitive) — score 3
  - `state` (Same state): same state, different/missing city — score 2
  - Missing location: candidate or source lacking state is never matched
- **Value Compatibility Reuse**:
  - Calls Phase 6's canonical `compareValues()` directly — zero duplication
  - `Close Match` (≤20% diff): included, score 3
  - `Moderate Difference` (≤50% diff): included, score 1
  - `Large Difference` (>50% diff): excluded
- **Deterministic Ranking**:
  - `matchScore = locationScore + valueScore` (range 3–6)
  - Sorted by: `score DESC → absoluteDifference ASC → createdAt DESC`
- **Backend API**:
  - `GET /api/listings/:id/matches?limit=N` (public read-only endpoint)
  - Excludes source listing, own-owner listings, and non-available (pending/swapped) listings
- **Frontend Integration**:
  - `ItemDetailsPage.jsx`: "Nearby Swap Matches" section for available listings
  - Reuses existing `ListingCard`, `Loader`, `EmptyState`, `ErrorMessage` components
  - Displays match reason badges (`📍 Location tier`, `💰 Value classification`)
  - `listingApi.js`: `getListingMatches` helper
  - `index.css`: styles for `.matches-section`, `.matches-grid`, `.match-reason`, `.match-tag`

### Phase 7 Automated Integration Test Results

The test suite (`backend/tests/phase7-location-matching-tests.js`) was executed against the running backend with disposable test users/listings and tracked cleanup:

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| malformed listing ID -> 400 | 400 | 400 | Passed |
| nonexistent listing -> 404 | 404 | 404 | Passed |
| valid listing -> 200 | 200 | 200 | Passed |
| response has expected structure | true | true | Passed |
| source listing excluded from results | false | false | Passed |
| same city+state -> included as "exact" | exact | exact | Passed |
| same state, diff city -> included as "state" | state | state | Passed |
| different state -> excluded | not found | not found | Passed |
| candidate with no location -> excluded | not found | not found | Passed |
| case-insensitive location matching works | true | true | Passed |
| no-location source -> 200 | 200 | 200 | Passed |
| no-location source -> empty matches | 0 | 0 | Passed |
| no-location source -> has message | true | true | Passed |
| Close Match (≤20%) -> included | Close Match | Close Match | Passed |
| Moderate Difference (≤50%) -> included | Moderate Difference | Moderate Difference | Passed |
| Large Difference (>50%) -> excluded | not found | not found | Passed |
| equal value -> included as Close Match | Close Match | Close Match | Passed |
| equal value -> 0% difference | 0 | 0 | Passed |
| both zero-value -> included as Close Match | Close Match | Close Match | Passed |
| exactly 20% diff -> Close Match | Close Match | Close Match | Passed |
| exactly 50% diff -> Moderate Difference | Moderate Difference | Moderate Difference | Passed |
| pending listing -> excluded from matches | not found | not found | Passed |
| swapped listing -> excluded from matches | not found | not found | Passed |
| exact match ranked above state match | true | true | Passed |
| no duplicates in results | 6 | 6 | Passed |
| match metadata structure correct | true | true | Passed |
| own-owner listings excluded | false | false | Passed |
| limit=1 returns at most 1 match | true | true | Passed |
| matches request does NOT modify source listing | true | true | Passed |
| matches request does NOT create swap requests | 2 | 2 | Passed |
| matches request does NOT create conversations | 2 | 2 | Passed |
| endpoint works without authentication | 200 | 200 | Passed |

**Final result:**
- Passed: 32
- Failed: 0
- Total: 32

Test data (4 test users, 16 test listings) was created and then fully removed by the script's cleanup step; no existing real data was affected.

## Notes

- This document reflects only test results explicitly confirmed by testing runs.
  - Phase 4: 20 confirmed tests (5 manual UI + 15 automated backend integration tests), all passed, 0 failed.
  - Phase 5: 20 automated backend integration test cases, all passed, 0 failed, plus manually-confirmed frontend UI behaviors.
  - Phase 6: 43 automated backend integration test cases, all passed, 0 failed.
  - Phase 7: 32 automated backend integration test cases, all passed, 0 failed.
- The automated test scripts (`backend/tests/phase4-swap-tests.js`, `backend/tests/phase5-chat-tests.js`, `backend/tests/phase6-value-comparator-tests.js`, `backend/tests/phase7-location-matching-tests.js`) are standalone test files separate from the application source code.
- Any test case not explicitly listed as Passed has not been verified and should not be assumed to pass.
