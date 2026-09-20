# Deployment

ReWear includes configuration files for deployment on Render (Backend/Frontend) and Vercel (Frontend).

## Render & Vercel Deployment

ReWear is designed to be deployed with the backend on Render and the frontend on Vercel.

1. **Backend (Render):**
   - Connect your GitHub repository to Render.
   - Render will detect the `render.yaml` blueprint.
   - The blueprint provisions the **Backend API** (Node.js web service).
   - You must manually supply the environment variables (like `MONGO_URI` and `CLOUDINARY_API_KEY`) in the Render dashboard.

2. **Frontend (Vercel):**
   - Connect your GitHub repository to Vercel.
   - Vercel will automatically detect the Vite project in the `frontend/` directory.
   - It will use the `vercel.json` file to configure SPA routing rules.

## Production Build

To build the frontend manually for production:

```bash
cd frontend
npm run build
```

The output will be placed in `frontend/dist/`. This directory contains static HTML, CSS, and JS that can be hosted on any static file server (e.g., via the included `vercel.json` configuration).

## Environment Configuration

In production, ensure the following environment variables are set securely on your backend server:

- `NODE_ENV=production`
- `MONGO_URI` (Points to a production cluster, e.g., MongoDB Atlas)
- `JWT_SECRET` (A strong, randomly generated string)
- `FRONTEND_URL` (The URL of your deployed frontend, required for CORS configuration)
- Cloudinary credentials

## Analytics

The frontend is pre-configured with Vercel Web Analytics and Speed Insights. These are automatically disabled in development but will activate when deployed to Vercel.

## Performance Notes: Render Free-Tier Cold Starts

The frontend on Vercel loads immediately, but the **first** API request after a period of inactivity can take well over 10 seconds. This is not caused by the React app, the Express handlers, or the MongoDB queries:

- Render spins a Free web service down after **15 minutes without inbound traffic** and spins it back up on the next request, which takes up to about a minute. While the container boots, Render serves an "Application loading" page instead of the API response. (See Render's [Free instance docs](https://render.com/docs/free#spinning-down-on-idle).)
- Once the service is warm, `GET /api/listings` is a small, indexed, server-side paginated query (`.select()` + `.slice('images', 1)` + `.lean()`, count and page fetched in parallel) that returns roughly 5–10 KB of JSON per page.

**How to tell the two apart:** open `https://clothing-exchange-marketplace.onrender.com/api/health` in a browser tab. If it takes many seconds (or shows the Render loading page) the service is cold-starting; if it answers instantly with `"database": "connected"` but listings are still slow, the delay is inside the application or database and worth investigating.

**Infrastructure options (not implemented in the app on purpose):**

- Upgrade the Render service to a paid instance type, which never spins down.
- Use an external uptime monitor (e.g. UptimeRobot, Better Uptime, a cron job) to request `/api/health` every 10–14 minutes. This is a deployment decision: the app itself does not ping the backend from every visitor's browser, because that would add load without helping the first visitor.
- Keep the Render region and the MongoDB Atlas cluster region close to each other; each listing page needs a couple of database round-trips, so cross-region latency multiplies.

The frontend keeps the experience responsive once the API is warm: the marketplace fetches immediately on load/filter/page changes (only free-text search is debounced), stale requests are cancelled, recently loaded marketplace pages are reused instantly when navigating back from an item (and revalidated in the background), and listing card images are requested at thumbnail size.

