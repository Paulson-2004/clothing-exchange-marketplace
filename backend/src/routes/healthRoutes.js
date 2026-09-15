const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/health
// Simple endpoint the frontend can call to confirm the API is up and
// check whether the database connection is currently active.
//
// This is especially important on Render's free tier: the service is
// automatically spun down after ~15 minutes of inactivity and takes
// 10-15 seconds to cold-start on the next real request, which feels
// broken to users. Pinging this endpoint periodically (e.g., every
// 10 minutes via a cron job or uptime monitor) keeps the service warm
// so that cold-starts never reach real users.
router.get('/', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.status(200).json({
    success: true,
    message: 'API is running',
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
