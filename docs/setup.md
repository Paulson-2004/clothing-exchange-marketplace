# Setup Guide

This guide explains how to run ReWear on your local machine for development.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Cloudinary Account** (For image uploads)

## 1. Install Dependencies

ReWear uses a monorepo-style structure without workspaces. You need to install dependencies in three places:

```bash
# Install root tools (concurrently)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 2. Environment Variables

### Backend
Create a .env file in the `backend/` directory:

```env
NODE_ENV=development
PORT=5001

# MongoDB Connection
MONGO_URI=mongodb://127.0.0.1:27017/rewear

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
COOKIE_EXPIRE=30

# Cloudinary (Image Hosting)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Frontend
Vite proxies API requests to the backend during development. No .env is strictly required for local development unless overriding API endpoints.

## 3. Database Seeding

To populate your local MongoDB with sample data for testing, run one of the seed scripts from the root directory:

```bash
# Seed development accounts and basic items
npm run seed:dev

# Seed administrative accounts
npm run seed:admin

# Seed demo data (users, listings, swaps)
npm run seed:demo
```
*Note: The dev seed creates deterministic test accounts (e.g., meera@rewear-dev.test and `admin@rewear-dev.test`) with the password `rewear-local-dev`. These credentials are for **LOCAL DEVELOPMENT ONLY** and should never be used in a production environment.*

## 4. Run the Application

Start both the frontend and backend servers simultaneously from the root directory:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

## Troubleshooting

- **MongoDB Connection Refused**: Ensure your local MongoDB service is running on port 27017.
- **Image Upload Fails**: Verify your Cloudinary credentials in `backend/.env`.
- **CORS Issues**: If accessing from a different port or network, ensure the `backend/server.js` CORS configuration allows your origin.

