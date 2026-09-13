# Development Guide

This guide covers testing, code standards, and common development tasks for ReWear.

## Development Scripts

The root `package.json` provides scripts to manage both the frontend and backend simultaneously using `concurrently`.

- `npm run dev`: Starts both Vite (frontend) and Nodemon (backend).
- `npm run build`: Builds the Vite frontend for production.
- `npm run seed:dev`: Clears the DB and seeds development data (including the `meera@rewear-dev.test` account).
- `npm run seed:admin`: Creates a local admin account.

## Backend Testing

The backend includes several targeted test scripts in the `backend/tests/` directory. These are not standard Jest/Mocha tests, but rather integration scripts that run against a local database to verify specific complex flows.

Run them via the backend `package.json`:
- `npm run test:phase4`: Tests swap request logic.
- `npm run test:phase5`: Tests chat conversation and message generation.
- `npm run test:phase6`: Tests the value comparator logic and warnings.
- `npm run test:phase7`: Tests location matching queries.
- `npm run test:phase8`: Tests admin panel capabilities.

## Image Handling (Cloudinary)

For local development, listing creation requires images. The application expects valid Cloudinary credentials in the backend `.env`. 

If you do not have Cloudinary set up, you can bypass image uploads during local testing by modifying the `createListing` controller in `listingController.js` to accept placeholder strings, or by using the database seed scripts which automatically inject pre-existing Cloudinary URLs.

## CSS and Theming

The application utilizes global CSS variables in `frontend/src/index.css` for theming.

- To change the primary brand color, modify `--color-primary`.
- Dark mode is implemented via a `[data-theme="dark"]` attribute on the `<html>` element. Avoid hardcoding colors in components; always use the `var(--color-*)` variables.

## Routing and Navigation

ReWear is a Single Page Application (SPA).
- We use a custom `<ScrollToTop>` component mounted in `App.jsx` to ensure route changes snap to the top of the viewport.
- It intentionally skips scrolling if the user is navigating via the browser's Back/Forward buttons (`POP` action), preserving native browser scroll restoration.
