# Architecture

ReWear is built as a Single Page Application (SPA) with a decoupled REST API backend. 

## High-Level Overview

- **Client**: A React application built with Vite, utilizing React Router for client-side navigation.
- **Server**: A Node.js and Express application serving RESTful JSON endpoints.
- **Data Layer**: MongoDB, interacted with via Mongoose ODM.
- **Assets**: Images are uploaded directly to Cloudinary through the backend using Multer.

## Frontend Architecture

The frontend is located in the `/frontend` directory.

- **Framework**: React 18
- **Routing**: `react-router-dom` (v6) with a standard `<BrowserRouter>`.
- **State Management**: React Context (`AuthContext`, `ThemeContext`) and standard Hooks (`useState`, `useEffect`).
- **Styling**: Global CSS (`index.css` and `chat.css`) utilizing CSS variables for consistent theming and dark mode.
- **Build Tool**: Vite

### Key Directories
- `/src/components`: Reusable UI elements (`ListingCard`, `EmptyState`, etc.).
- `/src/components/layout`: Structural components (`Navbar`, `Footer`, `ScrollToTop`, `ProtectedRoute`).
- `/src/pages`: Top-level route components (`HomePage`, `ItemDetailsPage`, `ChatPage`).
- `/src/services`: Axios-based API client wrappers (`api.js`, `listingApi.js`, `authApi.js`).
- `/src/context`: React context providers.

## Backend Architecture

The backend is located in the `/backend` directory.

- **Framework**: Express.js
- **Architecture Pattern**: Model-View-Controller (MVC) pattern, implemented as Controller-Route architecture without a separate service layer.
- **Database**: MongoDB with Mongoose.
- **Authentication**: JWT stored in HTTP-only cookies to prevent XSS.

### Key Directories
- `/src/routes`: Express router definitions mapping URLs to controller functions.
- `/src/controllers`: Request/Response handling logic.
- `/src/models`: Mongoose schema definitions.
- `/src/middleware`: Custom Express middleware (`auth.js` for JWT verification, `upload.js` for Multer/Cloudinary, `error.js` for global error handling).
- `/src/utils`: Helper functions (`asyncHandler`, `valueEstimator`, `valueComparator`).

## Authentication Flow

1. User submits login credentials.
2. Backend verifies and issues a JSON Web Token (JWT).
3. Backend sets the JWT in an `HttpOnly` cookie.
4. Frontend `AuthContext` reads the user profile from a `/api/auth/me` endpoint.
5. Subsequent API requests automatically include the cookie for authentication.

