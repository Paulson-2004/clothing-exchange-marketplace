# Clothing Exchange & Swap Marketplace

A sustainable clothing exchange platform where users list, browse, and swap clothing items without money changing hands.

**Status: Phase 1 — Project Scaffolding**

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

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` and fill in:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string (used starting Phase 2)
- Leave Cloudinary and admin seed vars blank for now — not used until later phases

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
