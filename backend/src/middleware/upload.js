const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Files are kept in memory as Buffers (never written to our own disk)
// and handed to Cloudinary's upload_stream API by the controller via
// uploadBufferToCloudinary below. This avoids multer-storage-cloudinary,
// which pins to the Cloudinary 1.x SDK and conflicts with cloudinary 2.x.
const storage = multer.memoryStorage();

// Only accept actual image files, regardless of what the client claims
// the extension is - checks the real mimetype.
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
    files: 5, // max 5 images per listing
  },
});

// Uploads a single in-memory image buffer to Cloudinary using the
// upload_stream API, and resolves with the resulting secure HTTPS URL.
// Used by listingController for each file in req.files after multer
// has parsed the multipart form data.
const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'clothing-exchange/listings',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = { upload, uploadBufferToCloudinary };
