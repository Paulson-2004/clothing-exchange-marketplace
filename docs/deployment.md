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

