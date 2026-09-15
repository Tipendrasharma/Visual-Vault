/**
 * Visual Vault - Storage Service
 *
 * This decides WHERE an uploaded image file actually ends up.
 *
 * - If ImageKit keys are set in .env → the file is uploaded to ImageKit's
 *   cloud CDN, and we get back a real, permanent, fast-loading URL.
 * - If ImageKit is NOT configured → the file is saved to a local
 *   `backend/uploads` folder on this server instead, and served back
 *   through our own Express app. This is a real (not fake) fallback,
 *   so uploads always work even before ImageKit is set up — it's just
 *   not on a CDN yet.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ImageKit from 'imagekit';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function isImageKitConfigured() {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  );
}

function getImageKitClient() {
  return new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
}

export const storageService = {
  /**
   * Takes the raw file object Multer gives us (file.buffer holds the
   * actual image bytes) and returns a clean object describing where
   * it ended up: { imageUrl, thumbnailUrl, fileType, sizeBytes, source }
   */
  async processUpload(file, customTitle = '') {
    const safeName = (customTitle || file.originalname || 'upload')
      .toString()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 40);
    const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeName}`;

    if (isImageKitConfigured()) {
      // Real cloud upload — ImageKit stores the file and gives us a CDN URL.
      const imagekit = getImageKitClient();
      const result = await imagekit.upload({
        file: file.buffer, // base64 or binary buffer is accepted directly
        fileName: uniqueName,
        folder: '/visual-vault'
      });

      return {
        imageUrl: result.url,
        // ImageKit lets us request a resized version via URL transformation —
        // this generates a 400px-wide thumbnail without a separate upload.
        thumbnailUrl: `${result.url}?tr=w-400`,
        fileType: file.mimetype || 'image/jpeg',
        sizeBytes: file.size || result.size || 0,
        dimensions: { width: result.width || 1920, height: result.height || 1080 },
        source: 'ImageKit CDN'
      };
    }

    // Fallback: save the real file to local disk so it's not lost/faked.
    const ext = path.extname(file.originalname || '') || '.jpg';
    const filename = `${uniqueName}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, file.buffer);

    const localUrl = `/uploads/${filename}`;
    return {
      imageUrl: localUrl,
      thumbnailUrl: localUrl,
      fileType: file.mimetype || 'image/jpeg',
      sizeBytes: file.size || 0,
      dimensions: { width: 1920, height: 1080 },
      source: 'Visual Vault (Local Storage)'
    };
  }
};
