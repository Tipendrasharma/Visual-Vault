/**
 * Visual Vault - Navigation Bar Component
 * Brand logo, page links, global search box, and the login/upload/
 * user-menu buttons on the right (which change based on auth state).
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Upload, User, LogOut, ChevronDown, FolderLock, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useVault } from '../context/VaultContext.jsx';

export default function Navbar({ onSearchSubmit, searchValue = '', setSearchValue }) {
  const { user, role, isCreator, isAuthenticated, logout, logoutAll, openAuthModal } = useAuth();
  const { setUploadModalOpen } = useVault();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // This is a "controlled input" — its value always comes from the
  // searchValue prop (owned by App.jsx), and every keystroke calls
  // setSearchValue to update it there. React re-renders this input
  // with the new value, which is what makes it show what you typed.
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (onSearchSubmit) {
        onSearchSubmit(searchValue);
      } else {
        navigate(`/?q=${encodeURIComponent(searchValue)}`);
      }
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      setUploadModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Brand logo + main nav links. location.pathname tells us which
            page we're on, so we can highlight the active link. */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="font-bold text-xl tracking-tight text-neutral-900 font-['Plus_Jakarta_Sans']">
              Visual Vault
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <Link 
              to="/explore" 
              className={`hover:text-black transition-colors ${location.pathname === '/explore' ? 'text-black font-semibold' : ''}`}
            >
              Explore
            </Link>
            <Link 
              to="/discover" 
              className={`hover:text-black transition-colors ${location.pathname === '/discover' ? 'text-black font-semibold' : ''}`}
            >
              Discover
            </Link>
            <Link 
              to="/studio" 
              className={`hover:text-black transition-colors ${location.pathname === '/studio' ? 'text-black font-semibold' : ''}`}
            >
              Studio
            </Link>
          </nav>
        </div>

        {/* Global search box */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search photos, architecture, styles..."
              value={searchValue}
              onChange={(e) => setSearchValue && setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-100 hover:bg-neutral-150 focus:bg-white text-sm rounded-full border border-transparent focus:border-neutral-300 focus:outline-none transition-all placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Right side buttons change based on auth state — this is
            conditional rendering, one of the most common React patterns */}
        <div className="flex items-center gap-3">
          {/* Conditional Action Button: Only Creators see Upload; regular users see Become a creator */}
          {isAuthenticated && (isCreator || user?.role === 'admin') ? (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
              title="Upload photos to Visual Vault"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('signup', 'creator')}
              className="flex items-center px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
              title="Become a creator to share your visual works"
            >
              <span>Become a creator</span>
            </button>
          )}

          {/* User Profile or Login/Signup Actions */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-all cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-black hover:bg-neutral-800 rounded-full transition-all cursor-pointer"
              >
                Join Archive
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200 cursor-pointer"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-neutral-300"
                />
                <span className="hidden lg:inline text-xs font-semibold text-neutral-800">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 text-sm"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-semibold text-neutral-900 truncate">{user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 text-neutral-700 hover:text-black cursor-pointer"
                    >
                      <User className="w-4 h-4 text-neutral-400" />
                      <span>My Profile & Vault</span>
                    </Link>
                    {!isCreator && user?.role !== 'admin' && (
                      <button
                        onClick={() => openAuthModal('signup', 'creator')}
                        className="w-full text-left flex items-center px-4 py-2 hover:bg-neutral-100 text-neutral-800 font-medium text-xs cursor-pointer transition-colors"
                      >
                        <span>Become a Creator</span>
                      </button>
                    )}
                    <Link
                      to="/studio"
                      className="flex items-center justify-between px-4 py-2 hover:bg-neutral-100 text-neutral-700 hover:text-black cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FolderLock className="w-4 h-4 text-neutral-400" />
                        <span>Personal Studio</span>
                      </div>
                      {isCreator && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          Creator
                        </span>
                      )}
                    </Link>
                  </div>

                  <div className="border-t border-neutral-100 pt-1">
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                    <button
                      onClick={logoutAll}
                      className="w-full text-left flex items-center gap-2 px-4 py-1.5 text-xs text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Logout from all devices</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
