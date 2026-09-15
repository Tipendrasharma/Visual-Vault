/**
 * Visual Vault - Main Application Component
 *
 * This is where all the app's pages/routes are declared. We use a
 * "nested route" pattern: every page below shares the same
 * <MainLayout> (navbar + footer stay on screen, only the middle
 * content changes) — see layouts/MainLayout.jsx for how that works
 * with React Router's <Outlet />.
 */

import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import StudioVaultPage from './pages/StudioVaultPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CreatorProfilePage from './pages/CreatorProfilePage.jsx';

export default function App() {
  // This search box's value lives here (in App) instead of inside the
  // Navbar itself, because both the Navbar AND the search results page
  // need to read/update it — this is "lifting state up" to their
  // closest shared parent.
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();

  const handleGlobalSearchSubmit = (searchTerm) => {
    // Navigate to the homepage with the search term in the URL,
    // e.g. /?q=car — HomePage reads this and runs the search.
    navigate(`/?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <Routes>
      {/* This parent route has no path of its own — it just wraps
          every child route below in MainLayout (navbar/footer) */}
      <Route
        path="/"
        element={
          <MainLayout
            searchValue={globalSearch}
            setSearchValue={setGlobalSearch}
            onSearchSubmit={handleGlobalSearchSubmit}
          />
        }
      >
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="studio" element={<StudioVaultPage />} />
        <Route path="profile" element={<ProfilePage />} />
        {/* :id is a route parameter — CreatorProfilePage reads it via useParams() */}
        <Route path="creator/:id" element={<CreatorProfilePage />} />
        <Route path="creators" element={<ExplorePage />} />
        {/* Catch-all: any unknown URL falls back to the homepage */}
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
