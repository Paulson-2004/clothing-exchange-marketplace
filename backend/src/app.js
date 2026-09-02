const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const swapRoutes = require('./routes/swapRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (e.g. Render / Cloudflare / Heroku load balancers)
app.set('trust proxy', 1);

// --- Core middleware ---
app.use(express.json());
app.use(cookieParser());

// CORS: allow the configured frontend origin(s) with credentials (cookies)
const getAllowedOrigins = () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return clientUrl.split(',').map((url) => url.trim().replace(/\/+$/, ''));
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      // Allow requests with no origin (such as mobile apps, server-to-server, or automated test runners)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// --- Routes ---
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/chat', chatRoutes);

app.use('/api/admin', adminRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
