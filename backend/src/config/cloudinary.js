const cloudinary = require('cloudinary').v2;

// Cloudinary configuration - isolated here so no other file needs to
// know about Cloudinary directly (see middleware/upload.js, the only
// consumer of this module).
//
// Requires these environment variables in backend/.env:
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
//
// These are read server-side only and are never sent to the frontend.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
