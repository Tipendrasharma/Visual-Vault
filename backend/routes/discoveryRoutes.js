/**
 * Visual Vault - Discovery Routes
 */

import { Router } from 'express';
import { discoveryController } from '../controllers/discoveryController.js';

const router = Router();

// Multi-provider search
router.get('/search', discoveryController.search);

// Trending visual search tags and categories
router.get('/trending', discoveryController.getTrending);

// Explore page sections (most liked, most downloaded, newest, categories, creators)
router.get('/explore', discoveryController.getExploreSections);

// Connected API providers status
router.get('/providers', discoveryController.getProviders);

export default router;
