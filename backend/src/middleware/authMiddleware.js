const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT from the httpOnly cookie and attaches the
// corresponding user document to req.user. Used on any route that
// requires the caller to be logged in.
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401);
      throw new Error('Not authenticated - no token provided');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      res.status(401);
      throw new Error('Not authenticated - invalid or expired token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Not authenticated - user no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Must be used AFTER `protect` on a route, since it relies on req.user
// already being set. Restricts access to admin accounts only.
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    return next(new Error('Admin access required'));
  }
  next();
};

module.exports = { protect, requireAdmin };
