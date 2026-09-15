/**
 * Visual Vault - Main Application Layout
 *
 * This is the shared "shell" for every page: navbar on top, footer
 * at the bottom, and the page-specific content rendered in between
 * via React Router's <Outlet />. Global modals (login, upload,
 * folder) also live here, because they can be triggered from
 * anywhere in the app, not just one page.
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import AuthModal from '../components/AuthModal.jsx';
import UploadModal from '../components/UploadModal.jsx';
import FolderModal from '../components/FolderModal.jsx';
import { useVault } from '../context/VaultContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck } from 'lucide-react';

export default function MainLayout({ searchValue, setSearchValue, onSearchSubmit }) {
  // Reading shared state from Context instead of receiving it as
  // props from a parent — this is what "global state" means in practice.
  const { uploadModalOpen, setUploadModalOpen, folderModalOpen, setFolderModalOpen, editingFolder } = useVault();
  const { authModalOpen } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans antialiased selection:bg-black selection:text-white">

      <Navbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        onSearchSubmit={onSearchSubmit}
      />

      {/* <Outlet /> is where React Router renders whichever child route
          matched the current URL (HomePage, ExplorePage, etc.) */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* These modals only render when their "open" flag is true —
          this is conditional rendering, a core React concept */}
      {authModalOpen && <AuthModal />}
      {uploadModalOpen && <UploadModal onClose={() => setUploadModalOpen(false)} />}
      {folderModalOpen && (
        <FolderModal
          onClose={() => setFolderModalOpen(false)}
          editFolder={editingFolder}
        />
      )}

      <footer className="border-t border-neutral-200/80 bg-neutral-50/70 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-neutral-200/60">
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-black text-white font-bold flex items-center justify-center text-xs">
                  V
                </div>
                <span className="font-bold text-neutral-900 text-sm">Visual Vault</span>
              </div>
              <p className="text-xs text-neutral-500 max-w-sm">
                Next-generation Image Discovery & Personal Asset Management platform delivering crystal-clear 4K, 2K, and Full HD visual assets.
              </p>
            </div>

            {/* Supported Quality Formats */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-800">Supported Formats:</span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-amber-700 font-semibold">4K Ultra HD</span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-emerald-700 font-semibold">2K QHD</span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-blue-700 font-semibold">1080p Full HD</span>
              <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-neutral-700 font-semibold">Lossless RAW</span>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} Visual Vault Inc. Production Full Stack Architecture.</p>
            <div className="flex items-center gap-6">
              <Link to="/explore" className="hover:text-black transition-colors">Explore</Link>
              <Link to="/discover" className="hover:text-black transition-colors">Unified Search</Link>
              <Link to="/studio" className="hover:text-black transition-colors">Personal Studio</Link>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> All Services Operational
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
