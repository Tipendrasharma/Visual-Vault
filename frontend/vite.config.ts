/**
 * Visual Vault - Frontend Vite Config
 *
 * The dev proxy below is what lets frontend code call fetch('/api/...')
 * and fetch('/uploads/...') without knowing the backend's real address
 * — Vite transparently forwards those requests to the backend server
 * (see backend/server.js, running on PORT from backend/.env, default 5000).
 * In production, the built frontend would instead be served from
 * somewhere that has a real reverse proxy (e.g. Nginx) doing the same job.
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const BACKEND_URL ='http://localhost:5000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
      '/uploads': { target: BACKEND_URL, changeOrigin: true }
    }
  }
});
