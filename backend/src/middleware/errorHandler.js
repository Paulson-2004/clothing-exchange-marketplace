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
  // Multer (file upload) errors don't set res.statusCode themselves,
  // so without this they'd fall through to the 500 default below even
  // though they're really a client input problem (bad file type, too
  // large, too many files). This is additive - every other error type
  // behaves exactly as before.
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  if (err.name === 'MulterError') {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only include the stack trace outside production, to avoid
    // leaking internals to end users.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
