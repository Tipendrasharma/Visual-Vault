# Visual Vault

A full-stack Digital Asset Management (DAM) app — search, upload,
organize, and manage images. Built with React (frontend) and
Node.js/Express/MongoDB (backend), kept as two independent apps.

## Project structure

```
visual-vault/
├── backend/     — Express API server (own package.json)
└── frontend/    — React + Vite app (own package.json)
```

Each folder is installed and run separately — there is no shared
root `package.json`.

## Running locally

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```
Starts the API server on http://localhost:5000 (or whatever `PORT`
is set to in `.env`).

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Starts the Vite dev server (usually http://localhost:5173). Its
`vite.config.ts` proxies `/api` and `/uploads` requests to the
backend automatically, so the frontend never needs to know the
backend's exact URL.

## Environment variables

See `backend/.env.example` for the full list (MongoDB URI, JWT
secrets, ImageKit keys, Pixabay/Pexels API keys). The frontend
currently needs no environment variables of its own.
