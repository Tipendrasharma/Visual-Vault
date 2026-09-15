/**
 * Visual Vault - Image Routes
 */

import { Router } from 'express';
import { imageController } from '../controllers/imageController.js';
import { authMiddleware, optionalAuthMiddleware, requireCreator } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { validateImageUpload, validateImageUpdate } from '../validators/imageValidator.js';

const router = Router();

// Protected Download endpoints (Authentication strictly required to download)
// NOTE: '/download-file' MUST be registered before the '/:id' route below.
// Express matches routes top-to-bottom, and '/:id' matches ANY single path
// segment — including the literal word "download-file" — so if '/:id' came
// first, every request to '/download-file' would be swallowed by it and
// imageController.proxyDownloadFile would never run.
router.get('/download-file', authMiddleware, imageController.proxyDownloadFile);
router.post('/:id/download', authMiddleware, imageController.downloadImage);

// Public / Guest endpoints (Browsing and viewing allowed without login)
router.get('/:id', optionalAuthMiddleware, imageController.getImageById);

// Protected Vault endpoints
router.get('/', authMiddleware, imageController.getVaultImages);
router.post(
  '/upload',
  authMiddleware,
  requireCreator,
  upload.single('image'),
  validateRequest(validateImageUpload),
  imageController.uploadImage
);
router.patch('/:id', authMiddleware, validateRequest(validateImageUpdate), imageController.updateImage);
router.delete('/:id', authMiddleware, imageController.deleteImage);
router.post('/:id/restore', authMiddleware, imageController.restoreImage);

export default router;