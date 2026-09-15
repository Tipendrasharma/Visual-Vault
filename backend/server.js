/**
 * Visual Vault - Backend Server
 * Standalone Express + MongoDB API server. The frontend is now a
 * completely separate app (its own package.json, its own Vite dev
 * server) and talks to this server over HTTP — see frontend's
 * vite.config for the dev proxy that forwards /api requests here.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // 1. Connect to MongoDB Atlas (required — server will not start without it)
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Visual Vault: Could not start — database connection failed.');
    console.error(err.message);
    process.exit(1);
  }

  // 2. Global Parsers
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  // 3. Serve locally-uploaded images (used when ImageKit isn't configured —
  // see services/storageService.js)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // 4. API Routes
  app.use('/api', apiRouter);

  // 5. Central Error Handling for API
  app.use('/api', errorHandler);

  // 6. Start listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Visual Vault Backend running on http://localhost:${PORT}`);
  });
}

startServer();
