// Centralized error handler. Every route/controller should pass errors
// to next(err) rather than sending its own error response, so all
// error formatting stays consistent in one place.

// Handles requests to routes that don't exist.
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Final error handler — must be registered last, after all routes.
const errorHandler = (err, req, res, next) => {
  // If a status code was already set (e.g. 400 for bad input), use it.
  // Otherwise default to 500 (unexpected server error).
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only include the stack trace outside production, to avoid
    // leaking internals to end users.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
