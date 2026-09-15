const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/health
// Simple endpoint the frontend can call to confirm the API is up and
// check whether the database connection is currently active.
// WHY WE NEED THIS: On Render's free tier, the backend spins down after 15
// minutes of inactivity and takes 10-15 seconds to "cold start" when a new request comes in.
// The frontend can periodically ping this endpoint to keep the server warm.
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
