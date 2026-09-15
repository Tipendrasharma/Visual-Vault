/**
 * Visual Vault - Social Routes
 */

import { Router } from 'express';
import { socialController } from '../controllers/socialController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Likes
router.post('/likes/toggle', authMiddleware, socialController.toggleLike);
router.get('/likes', authMiddleware, socialController.getUserLikes);

// Bookmarks (Saved Images)
router.post('/bookmarks/toggle', authMiddleware, socialController.toggleBookmark);
router.get('/bookmarks', authMiddleware, socialController.getUserBookmarks);

// Comments
router.get('/comments/:imageId', socialController.getComments);
router.post('/comments', authMiddleware, socialController.addComment);
router.post('/comments/:commentId/reply', authMiddleware, socialController.addReply);
router.delete('/comments/:id', authMiddleware, socialController.deleteComment);

// Download History
router.post(
  '/downloads',
  authMiddleware,
  socialController.recordDownload
);
router.get('/downloads', authMiddleware, socialController.getDownloadHistory);

// Recently Viewed
router.post('/recently-viewed', optionalAuthMiddleware, socialController.addRecentlyViewed);
router.get('/recently-viewed', optionalAuthMiddleware, socialController.getRecentlyViewed);

export default router;
