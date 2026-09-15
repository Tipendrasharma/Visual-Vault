/**
 * Visual Vault - Main API Router Index
 * Combines all feature routers into a single unified Express router.
 */

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import discoveryRoutes from './discoveryRoutes.js';
import imageRoutes from './imageRoutes.js';
import folderRoutes from './folderRoutes.js';
import socialRoutes from './socialRoutes.js';

const apiRouter = Router();

// API Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Visual Vault',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Feature Routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/discovery', discoveryRoutes);
apiRouter.use('/images', imageRoutes);
apiRouter.use('/folders', folderRoutes);
apiRouter.use('/social', socialRoutes);

export default apiRouter;
