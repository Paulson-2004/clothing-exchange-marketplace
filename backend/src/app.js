const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const healthRoutes = require('./routes/healthRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// --- Core middleware ---
app.use(express.json());
app.use(cookieParser());

// CORS: only allow the configured frontend origin, and allow cookies
// to be sent (needed for the httpOnly JWT cookie used by auth later).
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// --- Routes ---
app.use('/api/health', healthRoutes);

// More route groups (auth, listings, swaps, chat, value, admin) will
// be mounted here in later phases, e.g.:
// app.use('/api/auth', authRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
