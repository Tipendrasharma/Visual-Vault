/**
 * Visual Vault - Client Entry Point
 *
 * This is the very first file that runs in the browser. It:
 * 1. Wraps the whole app in <BrowserRouter> so React Router can
 *    handle page navigation without full page reloads.
 * 2. Wraps the app in our three Context Providers — this makes
 *    auth state, vault data, and social state (likes/comments)
 *    available to every component, without passing props down
 *    manually through every level ("prop drilling").
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { VaultProvider } from './context/VaultContext.jsx';
import { SocialProvider } from './context/SocialContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VaultProvider>
          <SocialProvider>
            <App />
          </SocialProvider>
        </VaultProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
