# Product Requirements Document
## Clothing Exchange & Swap Marketplace

### 1. Document Information
- **Product Name:** Clothing Exchange & Swap Marketplace
- **Document Purpose:** Final Product Requirements Document detailing the as-built functionality of the completed system.
- **Current Status:** Feature-Complete & Deployed (Production-Ready)
- **Version/Date:** 1.0.0 (September 2026)

### 2. Product Overview
The Clothing Exchange & Swap Marketplace is a sustainable web platform that facilitates direct, item-for-item clothing exchanges without any monetary transactions. It allows users to upload clothing they no longer wear, estimate the items' value, and securely trade them with other users. By focusing on reuse and localized matching, the platform solves the problem of clothing waste, enabling users to refresh their wardrobe sustainably and affordably.

### 3. Problem Statement
The product addresses the following practical problems:
- **Unused Clothing:** Users have wearable clothing sitting unused in their wardrobes.
- **Difficulty Finding Suitable Partners:** Exchanging clothes conventionally is hard without a structured marketplace to discover matching items.
- **Lack of Item-for-Item Exchanges:** Most platforms rely on monetary sales; finding direct swaps without money exchange is difficult.
- **Value Uncertainty:** Users face uncertainty around the relative fairness and value of items being traded.
- **Geographic Barriers:** Difficulty finding geographically suitable swap partners to make exchanges viable and convenient.

### 4. Product Goals
- Provide a robust, secure, and user-friendly platform for direct item-for-item clothing swaps.
- Determine and clearly present the fairness of swap requests using an algorithmic value comparison system.
- Facilitate matching between geographically close users to increase the probability of successful physical exchanges.
- Ensure all exchanges are managed safely with a structured, conflict-free state machine.

### 5. Target Users
- **Sustainable Fashion Advocates:** Users motivated by environmental concerns who want to recycle and reuse clothing.
- **Budget-Conscious Individuals:** Users looking to refresh their wardrobe without monetary expenditure.
- **Platform Administrators:** Moderators responsible for maintaining platform integrity, managing users, and monitoring swap activities.

### 6. Core User Journeys
- **Registration/Login:** Users register with an email and password, receiving a secure JWT authentication cookie.
- **Profile Setup/Location:** Users define their profile details (bio, phone) and granular location (city, state, country) to enhance matching.
- **Creating a Listing:** Users list an item with details (brand, size, condition, category, descriptions) and upload images.
- **Browsing/Searching/Filtering:** Users browse the marketplace, filtering by size, condition, category, and exact location.
- **Viewing Listing Details:** Users view item details, including seller information, estimated value, and nearby matching listings.
- **Finding Nearby Matches:** The system automatically suggests listings from users in the same city or state with compatible swap values.
- **Comparing Values:** When initiating a swap, users see a clear percentage difference and fairness classification between their offered item and the requested item.
- **Sending Swap Request:** Users propose a trade, selecting one of their available items in exchange for the requested item.
- **Accepting/Rejecting/Cancelling/Completing Swaps:** Users manage their requests through a structured dashboard, advancing the swap lifecycle safely.
- **Chatting/Negotiating:** Users can converse contextually about a specific swap request.
- **Viewing Swap History:** Users can view completed and historical swap requests in their profile.
- **Admin Moderation:** Admins view system-wide statistics, manage user roles, and delete inappropriate listings.

### 7. Functional Requirements

#### Authentication
- **Purpose:** Securely identify users and control access.
- **User-Facing Behavior:** Registration, Login, Logout actions.
- **Important Rules/Constraints:** Uses hashed passwords (bcrypt). Authentication tokens (JWT) are stored in secure, `httpOnly` cookies, completely isolated from frontend scripts.
- **Relevant Workflow:** Only logged-in users can view item details, request swaps, or access profiles. First registered user defaults to standard user, not admin.

#### User Profile
- **Purpose:** Provide identity and manage user-specific data.
- **User-Facing Behavior:** Users can view and edit their name, phone, bio, and location data (city, state, country). Users can also view their recent swap history and activity overview.
- **Important Rules/Constraints:** Email address is read-only after registration.

#### Marketplace/Listings
- **Purpose:** Display and manage the core items being traded.
- **User-Facing Behavior:** Users can create, edit, and delete their listings. Each listing requires title, category, size, condition, and image uploads.
- **Important Rules/Constraints:** Supports up to 5 image uploads per listing (Cloudinary). Estimated values are derived backend-side and stored securely. Owners can only edit or delete their own active listings.

#### Search & Filtering
- **Purpose:** Help users discover relevant items.
- **User-Facing Behavior:** Users can search by keyword, filter by category, condition, size, and explicit city/state locations.
- **Important Rules/Constraints:** Text indices on MongoDB enable efficient keyword search. Location filtering is case-insensitive exact string matching.

#### Swap Requests
- **Purpose:** Provide a structured agreement process for exchanges.
- **User-Facing Behavior:** Users select their listing to offer against a requested listing and manage incoming/outgoing requests.
- **Important Rules/Constraints:** Users cannot swap an item already involved in an accepted swap. A strict state machine prevents duplicate requests and conflicting states.

#### Chat & Negotiation
- **Purpose:** Facilitate direct communication to arrange exchanges.
- **User-Facing Behavior:** Users can send messages to the other party involved in a swap request. 
- **Important Rules/Constraints:** Only authorized participants of a swap can view or send messages in that conversation. Messages are ordered chronologically. Chat uses REST polling (WebSockets are not currently used).

#### Value Comparator
- **Purpose:** Ensure transparent and fair exchanges.
- **User-Facing Behavior:** Provides a visual classification of the swap fairness: `Close Match`, `Moderate Difference`, or `Large Difference`.
- **Important Rules/Constraints:** Operates based on a deterministic percentage difference algorithm. Does not use AI/ML.

#### Location-Based Matching
- **Purpose:** Recommend convenient swaps.
- **User-Facing Behavior:** Displays a "Nearby Swap Matches" section on item details.
- **Important Rules/Constraints:** Matches are hierarchical (exact city, then same state). Own listings are excluded. It combines location proximity with value compatibility, excluding "Large Difference" items.

#### Admin Panel
- **Purpose:** Provide system governance.
- **User-Facing Behavior:** Admins view aggregate statistics, list and manage users (demote/promote roles), monitor swaps, and can forcibly remove listings.
- **Important Rules/Constraints:** Admins cannot self-demote. Admins cannot read private chat messages.

#### Demo/Seed Data
- **Purpose:** Populate the app for evaluation.
- **User-Facing Behavior:** Users see realistic clothing items with real, high-resolution Unsplash images on first load.
- **Important Rules/Constraints:** Uses stable CDN URLs and includes resilient UI fallback behaviors if an image fails to load.

### 8. Detailed Swap Lifecycle
The lifecycle follows a strict state machine:

- **pending → accepted → completed**
  - **Pending:** A request is sent. Both items remain `available`.
  - **Accepted:** The receiver accepts the swap. Both listings transition to `pending`. Any conflicting swap requests involving these items are automatically rejected.
  - **Completed:** Either user marks it complete. Both listings transition to `swapped`.
- **pending → rejected**
  - The receiver denies the request. Listings remain `available`.
- **pending → cancelled**
  - The sender retracts the request before acceptance. Listings remain `available`.

**Rules:**
- **Ownership:** Users can only offer listings they own.
- **Duplicate Prevention:** A user cannot send another request for the same item pair if an active request exists.
- **Conflicting Requests:** Accepting a swap auto-rejects any other pending requests for the two items involved.

### 9. Location Matching Requirements
- **Exact City/State Matching:** Listings matching both city and state receive the highest proximity score.
- **Same-State Matching:** Listings matching only the state receive a secondary proximity score.
- **Exclusion:** The algorithm excludes the user's own listings and unavailable listings.
- **Value Compatibility:** Potential matches are filtered to ensure they fall within an acceptable value difference (rejects "Large Difference").
- **Match Scoring:** Combines proximity scores with value compatibility scores to deterministically rank results.
- **Sorting Behavior:** Matches are sorted by score in descending order.

### 10. Value Comparison Requirements
- **Estimated Item Values:** Calculated deterministically based on category, brand tier, and condition.
- **Percentage Difference:** Calculated algorithmically between the offered and requested item values.
- **Compatibility Classification:**
  - `Close Match` (≤ 20% difference)
  - `Moderate Difference` (21% - 40% difference)
  - `Large Difference` (> 40% difference)
- **Matching Contribution:** The comparator automatically excludes "Large Difference" items from automated location matches.

### 11. Chat Requirements
- **Swap-Linked Conversations:** Every chat thread is directly linked to a specific swap request.
- **Authorized Participants:** Only the requester and receiver of the swap request can access the chat.
- **Sending/Receiving Messages:** Text-based messages ordered chronologically.
- **Polling Behavior:** The frontend uses an active REST polling interval (every 4 seconds) to fetch new messages.
- **Unread Count:** Unread tracking is implemented.
- **Swap Context:** The chat UI displays the live status of the associated swap request in its header.
- **Constraint:** WebSockets are not currently used for real-time messaging.

### 12. Admin Requirements
- **Dashboard Statistics:** Displays aggregate counts of users, listings, swaps, and messages.
- **User Management:** View detailed user activity.
- **Role Management:** Ability to toggle users between `user` and `admin`.
- **Self-Demotion Protection:** An admin cannot demote their own account.
- **Listing Moderation:** Admins can delete listings. Deleting a listing cascades to auto-reject pending swaps.
- **Swap Monitoring:** View system-wide swap statuses.
- **Privacy Restrictions:** Admins do not have access to private user chat transcripts.

### 13. Non-Functional Requirements
- **Security:** Strict separation of concerns, JWT `httpOnly` cookies, bcrypt password hashing.
- **Authentication/Authorization:** Comprehensive Express middleware for `protect` (auth) and `requireAdmin` (role-based) routes.
- **Privacy:** Users only see public listing data and private data they explicitly own.
- **Error Handling:** Centralized backend error formatting guarantees consistent UI error states.
- **Performance:** Efficient MongoDB indexes limit query scope. Chat limits history to 200 messages without unbounded pagination.
- **Responsiveness:** CSS flexbox/grid layout gracefully degrades on smaller screens.
- **Maintainability:** Clear API/components/pages structure in React, and routes/controllers/models structure in Express.
- **Deployment:** Zero-downtime deployment pipelines via Vercel (Frontend) and Render (Backend) with configured cross-origin credential sharing. Note: Formal WCAG compliance certification has not been audited.

### 14. Data Requirements
Core entities stored in MongoDB Atlas:
- **User:** Stores credentials (hashed), roles, profile data, and nested location object (city, state, country).
- **Listing:** Stores title, brand, size, condition, category, images (Cloudinary URLs), estimated value, availability status, location, and owner reference.
- **SwapRequest:** Stores references to requester, receiver, offered listing, requested listing, status, and audit timestamps.
- **Conversation:** Links a swap request to the participants, tracks the last message timestamp.
- **Message:** Belongs to a conversation; stores sender reference, text content, and read status.

### 15. API/Integration Requirements
- **Backend API Responsibilities:** The Express.js backend exposes a RESTful API communicating strictly over JSON. It handles all business logic, validation, file upload orchestration (to Cloudinary), and database persistence. 
- The backend fully controls sensitive operations, such as deriving estimated values and managing the swap state machine, rejecting arbitrary frontend overrides.

### 16. UI/Page Requirements
Major functional pages include:
- `HomePage.jsx` - Core marketplace browsing.
- `ItemDetailsPage.jsx` - Specific listing insights and nearby matches.
- `CreateEditListingPage.jsx` - Listing upload/modification form.
- `SwapRequestsPage.jsx` - Inbox/outbox for swap lifecycle management.
- `MyListingsPage.jsx` - Personal inventory management.
- `ChatPage.jsx` - Contextual messaging interface.
- `ProfilePage.jsx` - Account management and recent swap history.
- **Admin Pages:** `AdminDashboardPage.jsx`, `AdminUsersPage.jsx`, `AdminListingsPage.jsx`, `AdminSwapsPage.jsx`, `AdminUserDetailPage.jsx`.

### 17. Security Requirements
- **Password Hashing:** Enabled using `bcryptjs` with salt rounds.
- **JWT Authentication:** Stateful user context managed safely without exposing the payload to localStorage.
- **httpOnly Cookies:** Defends against XSS credential theft.
- **CORS/Credential Handling:** Strongly locked down to specific frontend origin URL with `credentials: true`.
- **Route Protection:** Validates user existence and token validity on every secure route.
- **Ownership Enforcement:** Business logic explicitly checks `if (document.user.toString() !== req.user._id.toString())` to prevent unauthorized mutations.
- **Admin Authorization:** `requireAdmin` middleware strongly validates the user's role on restricted endpoints.
- **Secret Handling:** Keys and URIs are injected entirely via environment variables, never hardcoded.
- **Git History Sanitization:** Historical repository commits were safely purged of inadvertently exposed variables.

### 18. Testing & Acceptance
- **Automated Tests:** 100% test pass rate with 173/173 tests passing across all core modules.
- **Frontend Build:** The Vite production build compiles successfully with 0 errors.
- **Manual QA:** End-to-end production flow has been manually verified for 8 core functional areas.
- **Acceptance:** The product fully satisfies its required scope and operates without defect in a live production environment.

### 19. Deployment Requirements
- **Frontend:** Deployed as a Single Page Application (SPA) on Vercel. `vercel.json` configures client-side routing rewrites.
- **Backend:** Deployed as a Web Service on Render. `render.yaml` defines the start commands and environment configuration. Express is configured with `app.set('trust proxy', 1)` to handle secure cookies over load balancers.
- **Database:** MongoDB Atlas cluster providing managed cloud persistence.
- **Storage:** Cloudinary handles image hosting and optimization.

### 20. Scope and Constraints
- The platform strictly enforces direct item-for-item exchange.
- There is no monetary checkout or payment system integration.
- Algorithms are purely deterministic; no AI recommendation system is implemented.
- No AR/virtual try-on capabilities.
- The platform is a responsive web application; there is no native mobile app wrapper.
- Courier/shipping logistics are explicitly outside the current implementation scope.
- Real-time messaging uses polling; WebSocket support is excluded.

### 21. Known Limitations
- Swap agreement actions ("Accept", "Complete") are executed via the dedicated Swap Requests dashboard, rather than being inline controls directly embedded in the chat interface.
- Mobile navigation relies on responsive grid adjustments but lacks a dedicated hamburger-style mobile navigation paradigm.
- A formal WCAG accessibility audit has not been conducted.

### 22. Future Enhancements
- Richer mobile navigation elements.
- Inline swap action controls integrated directly into the chat stream.
- WebSocket-based real-time messaging to replace REST polling.
- Courier/postal shipping integration for non-local swaps.
- Comprehensive WCAG accessibility audit and remediation.

### 23. Acceptance Criteria
- [x] Application successfully deployed to production URLs.
- [x] 100% test pass rate on automated backend suite (173/173).
- [x] User authentication (register/login) flows function correctly.
- [x] Listings can be created, updated, and uploaded with images.
- [x] Swaps advance safely through pending → accepted → completed states.
- [x] Value comparator and location matcher yield deterministic, correct results.
- [x] Role-based admin panel allows listing removal and user governance.
- [x] Secure configuration is isolated from Git history.

### 24. Final Product Status
The Clothing Exchange & Swap Marketplace has successfully completed the entirety of its authoritative 8-phase roadmap. Production deployment and verification have been executed successfully. The product is complete, robust, and prepared for final delivery and evaluation.

