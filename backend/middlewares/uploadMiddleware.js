/**
 * Visual Vault - Multer Upload Middleware
 *
 * Multer reads the incoming file from the upload form and makes it
 * available as `req.file`. We use memoryStorage (not disk storage) so
 * the file stays as a Buffer in memory — that buffer is what
 * storageService.js then sends to ImageKit or writes to local disk.
 */

import multer from 'multer';

const storage = multer.memoryStorage();

// Only allow real image formats — anything else is rejected before
// it ever reaches our upload logic.
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload JPEG, PNG, WEBP, or GIF images.'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // reject anything over 10MB
  fileFilter
});
