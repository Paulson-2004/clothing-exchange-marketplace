# ReWear

ReWear is a web app for exchanging clothing. Instead of buying and selling, users trade their clothes directly with each other.

## Live Demo

- **Frontend:** https://rewear-swap.vercel.app/
- **Backend API:** https://clothing-exchange-marketplace.onrender.com

## Screenshots

### Marketplace

![ReWear Homepage](docs/images/rewear-homepage.png)

Browse and discover clothing available for direct item-for-item exchange.

![ReWear Item Details](docs/images/rewear-item-details.png)

View detailed information and estimated swap values for individual items.

### Listing Management

![ReWear My Listings](docs/images/rewear-my-listings.png)

Manage your personal wardrobe inventory and view swap statuses.

### Exchange Workflow

![ReWear Swap Requests](docs/images/rewear-swap.png)

Review incoming proposals and track outgoing swap requests.

![ReWear Chat](docs/images/rewear-chat.png)

Polling-based chat for coordinating accepted swaps and discussing exchange details.

### Member Experience

![ReWear Dashboard](docs/images/rewear-dashboard.png)

Monitor your active swaps and wardrobe from a personal dashboard.

### Administration

![ReWear Admin Dashboard](docs/images/rewear-admin.png)

Manage users, listings, and swap requests.

[View the complete screenshot gallery →](docs/screenshots.md)

## About

ReWear is built around item-for-item exchanges instead of buying and selling. You list items you want to trade, browse for things you like, and propose swaps using your own inventory. If the other person accepts, you can chat to work out the exchange.

## Features

- **Item-for-Item Swapping**: Propose trades using your own listed inventory instead of cash.
- **Chat-based Negotiation**: Polling-based chat for working out exchange details.
- **Value Matching**: Warnings if someone tries to trade a cheap item for an expensive one.
- **Location-based Filtering**: Find items nearby using city/state text searches.
- **Admin Dashboard**: Tools for moderating users, listings, and swap requests.
- **Dark Mode Support**: Full light and dark theme support via CSS variables.

## Tech Stack

- **Frontend**: React, React Router v6, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (HTTP-only cookies)
- **Image Storage**: Cloudinary (via Multer)

## Project Structure

```text
ReWear/
├── frontend/                  # React SPA (Vite)
│   └── src/
│       ├── api/               # Axios API client & endpoints
│       ├── components/        # Reusable UI components
│       │   ├── admin/
│       │   ├── chat/
│       │   ├── layout/
│       │   ├── listing/
│       │   └── swap/
│       ├── context/           # React Context (Auth, Theme)
│       ├── pages/             # Route-level components
│       └── utils/             # Frontend formatting & logic helpers
├── backend/                   # Node.js Express API
│   └── src/
│       ├── config/            # DB and third-party configuration
│       ├── controllers/       # Route request handlers
│       ├── middleware/        # Auth, error, and upload middleware
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Express router definitions
│       ├── scripts/           # Database seeding utilities
│       └── utils/             # Backend helper functions
├── docs/                      # Project documentation
│   ├── archive/               # Historical PRDs and specs
│   └── images/                # Screenshots and assets
└── README.md
```
*The frontend and backend are decoupled and communicate via a REST API.*

## Quick Setup

1. **Clone and Install**
   Install dependencies for the root, frontend, and backend:
```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
```

2. **Environment Variables**
   Create a .env file in the `backend/` directory:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/rewear
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   ```

3. **Start Development Servers**
   From the project root:
```bash
   npm run dev
```
   This uses concurrently to run both the Vite frontend (port 5173) and the Express backend (port 5001).

## Documentation

Detailed documentation can be found in the /docs directory:

- [Setup Guide](docs/setup.md)
- [Architecture](docs/architecture.md)
- [Features](docs/features.md)
- [API Reference](docs/api.md)
- [Database Schema](docs/database.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [FAQ](docs/faq.md)
- [Recent Changes](docs/recent-changes.md)
