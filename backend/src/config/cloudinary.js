// Cloudinary configuration — isolated here so no other file needs to
// know about Cloudinary directly. This will be wired up in the
// Listings phase (Phase 3), once image upload is actually implemented.
//
// Usage later will look like:
//
//   const cloudinary = require('./cloudinary');
//   cloudinary.uploader.upload(...)
//
// Requires these environment variables (see .env.example):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
//
// Left as a stub for now so the folder structure is in place without
// installing the cloudinary package before it's actually used.

module.exports = null;
