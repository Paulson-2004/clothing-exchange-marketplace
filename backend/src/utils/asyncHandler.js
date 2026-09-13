// Wraps an async route handler so any thrown/rejected error is passed
// to next(), reaching the central errorHandler middleware, without
// needing a try/catch block in every controller function.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
