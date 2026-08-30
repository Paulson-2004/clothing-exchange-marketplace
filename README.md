# Clothing Exchange & Swap Marketplace

A sustainable clothing exchange platform where users list, browse, and swap clothing items without money changing hands.

**Status: Phase 3 — Clothing Listings**

## Stack
- Frontend: React (Vite), React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Auth: JWT in httpOnly cookies, bcryptjs (added in Phase 2)
- Images: Cloudinary (added in Phase 3)

## Project Structure
```
clothing-exchange/
├── backend/     Express API
└── frontend/    React (Vite) client
```

## Phase 1 — What's included
- Express server with MongoDB connection (`backend/`)
- `/api/health` endpoint reporting API + DB status
- Global error handling middleware skeleton
- CORS configured for the frontend origin, with credentials enabled (needed for the cookie-based auth added in Phase 2)
- React (Vite) app that calls `/api/health` on load and displays connection status
- Full folder structure for all upcoming features (auth, listings, swaps, chat, admin), currently empty placeholders

## Phase 2 — What's included
- User model (`backend/src/models/User.js`) with hashed password (`select: false`)
- Register, login, logout, and `/api/auth/me` endpoints
- JWT stored in an httpOnly cookie (not accessible to JS, not in localStorage)
- `protect` middleware (verifies the cookie) and `requireAdmin` middleware (not used by any route yet)
- Admin seed script (`npm run seed:admin`), run manually and separately from registration
- Frontend `AuthContext` restoring session on page refresh via `/api/auth/me`
- `ProtectedRoute` component, auth-aware `Navbar`, Login/Register pages
- Minimal `HomePage` and `DashboardPage` placeholders (full versions come in later phases)

## Phase 3 — What's included
- Listing model, full CRUD (`POST/GET/PUT/DELETE /api/listings`), ownership enforced server-side
- Search + category/size/condition/city/state filtering on `GET /api/listings`
- Cloudinary image upload via `multer` + `multer-storage-cloudinary` (isolated in `config/cloudinary.js` and `middleware/upload.js`)
- Deterministic swap value estimator (`utils/valueEstimator.js`) with a live `GET /api/listings/estimate-value` endpoint
- Real Marketplace (`HomePage`), Item Details, Create/Edit Listing (with image preview + value suggestion), and My Listings pages on the frontend
- "Request Swap" button present but disabled — swap requests are Phase 5

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` and fill in:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — only needed if you want to run the admin seed script (optional in Phase 2, no admin panel exists yet)
- Leave Cloudinary vars blank for now — not used until the Listings phase

Run the server:
```bash
npm run dev
```
You should see:
```
MongoDB connected: <your-cluster-host>
Server running in development mode on port 5000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

## How to test Phase 1

1. Start the backend (`npm run dev` in `backend/`) — confirm it logs a successful MongoDB connection.
2. In a browser, visit `http://localhost:5000/api/health` directly — you should get JSON like:
   ```json
   { "success": true, "message": "API is running", "database": "connected", "timestamp": "..." }
   ```
3. Start the frontend (`npm run dev` in `frontend/`) and open it in a browser.
4. The page should show a green status dot and "Backend + database connected", along with the raw health-check JSON below it.
5. To verify error handling works: stop the backend server, refresh the frontend — it should show a red dot and "Could not reach backend" instead of crashing.

If all five checks pass, the full stack (React → Express → MongoDB) is correctly wired and we're ready for Phase 2 (Authentication).

## Notes
- `backend/src/config/cloudinary.js` is currently a stub — it will be implemented in Phase 3 when image upload is built, so the `cloudinary` package isn't installed before it's needed.
- Empty folders (`models/`, `controllers/`, `pages/`, etc.) contain a `.gitkeep` file just to preserve the structure in git; they'll be filled in as each phase is implemented.
