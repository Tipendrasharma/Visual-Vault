/**
 * Visual Vault - Folder Routes
 */

import { Router } from 'express';
import { folderController } from '../controllers/folderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { validateFolderCreate } from '../validators/folderValidator.js';

const router = Router();

// All folder actions require authentication
router.use(authMiddleware);

router.get('/', folderController.getFolders);
router.post('/', validateRequest(validateFolderCreate), folderController.createFolder);
router.patch('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);
router.post('/move-asset', folderController.moveImage);

export default router;
