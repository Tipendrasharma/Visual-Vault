/**
 * Visual Vault - Social Context
 *
 * Global state for likes, saved (bookmarked) images, download history,
 * and recently-viewed images. Uses a technique called "optimistic
 * updates" for likes/saves: the heart icon fills in immediately when
 * clicked, before the server has even responded — this makes the app
 * feel instant. If the server request fails, we simply undo the change.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const SocialContext = createContext(null);

export const SocialProvider = ({ children }) => {
  const { user, openAuthModal } = useAuth();
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // When the user logs in, load their existing likes/saves/downloads.
  // When they log out, clear it all back to empty.
  useEffect(() => {
    if (!user) {
      setLikedIds(new Set());
      setSavedIds(new Set());
      setDownloadHistory([]);
      return;
    }

    const loadSocialData = async () => {
      try {
        const [likesRes, bookmarksRes, downloadsRes] = await Promise.all([
          api.social.getUserLikes(),
          api.social.getUserBookmarks(),
          api.social.getDownloadHistory()
        ]);

        if (likesRes.success && likesRes.data?.likedImageIds) {
          setLikedIds(new Set(likesRes.data.likedImageIds));
        }
        if (bookmarksRes.success && bookmarksRes.data?.savedImageIds) {
          setSavedIds(new Set(bookmarksRes.data.savedImageIds));
        }
        if (downloadsRes.success && downloadsRes.data) {
          setDownloadHistory(downloadsRes.data);
        }
      } catch (err) {
        console.error('Error fetching social state:', err);
      }
    };

    loadSocialData();
  }, [user]);

  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const res = await api.social.getRecentlyViewed();
        if (res.success && res.data) {
          setRecentlyViewed(res.data);
        }
      } catch (e) {
        // Ignore — recently-viewed is a nice-to-have, not critical
      }
    };
    loadRecentlyViewed();
  }, []);

  // Toggle Like — must be logged in
  const toggleLike = async (image) => {
    const imageId = image.id || image._id;
    if (!user) {
      openAuthModal('login', 'user', 'Please log in to like photos and save your favorites.');
      return false;
    }

    // Update the UI immediately (optimistic update) — see file comment above
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });

    try {
      const res = await api.social.toggleLike(image);
      if (res.success) {
        return res.data?.isLiked;
      }
    } catch (err) {
      // The server call failed — undo the optimistic change we made above
      setLikedIds(prev => {
        const next = new Set(prev);
        if (next.has(imageId)) next.delete(imageId);
        else next.add(imageId);
        return next;
      });
    }
  };

  // Toggle Bookmark — same optimistic-update pattern as toggleLike
  const toggleBookmark = async (image) => {
      const imageId = image.id || image._id;

    if (!user) {
      openAuthModal('login', 'user', 'Please log in to save photos to your personal vault.');
      return false;
    }

    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });

    try {
      const res = await api.social.toggleBookmark(image);
      if (res.success) {
        return res.data?.isSaved;
      }
    } catch (err) {
      setSavedIds(prev => {
        const next = new Set(prev);
        if (next.has(imageId)) next.delete(imageId);
        else next.add(imageId);
        return next;
      });
    }
  };

  // Download Trigger — must be logged in
  const triggerDownload = async (image) => {
    if (!user) {
      openAuthModal('login', 'user', 'Please log in to download high-resolution photos and assets.');
      return false;
    }

    if (!image) return;

    const imgId = image.id || image._id;
    const targetUrl = image.imageUrl || image.thumbnailUrl;
    if (!targetUrl) return;

    const rawTitle = image.title || 'visual_vault_asset';
    const cleanName = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 40) || 'image';
    const filename = `${cleanName}.jpg`;

    // 1. Tell the backend a download happened (for the download counter),
    // without waiting for it — the actual file download shouldn't be
    // delayed by this bookkeeping call.
    try {
      if (imgId) {
        await api.images.download(image);
      }
    } catch (e) {
      // Non-blocking
    }

    // 2. Try to download the file directly in the browser
    try {
      const response = await fetch(targetUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Direct fetch failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
      // Fallback: some image sources block direct cross-origin fetches
      // (CORS), so we ask our own backend to fetch and stream the file
      // instead. A plain <a> tag can't send an Authorization header, so
      // the access token is passed as a query param here — that's a
      // known trade-off (tokens in URLs can end up in server logs), but
      // it's a short-lived access token, not the refresh token.
      const token = getStoredToken();
      const proxyDownloadUrl = `/api/images/download-file?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(cleanName)}&id=${encodeURIComponent(imgId || '')}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      const link = document.createElement('a');
      link.href = proxyDownloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // 3. Refresh download history after a short delay (gives the
    // backend time to save the download record first)
    if (user) {
      setTimeout(async () => {
        try {
          const historyRes = await api.social.getDownloadHistory();
          if (historyRes.success) setDownloadHistory(historyRes.data);
        } catch (e) {}
      }, 800);
    }
  };

  const recordView = async (imageId) => {
    try {
      await api.social.addRecentlyViewed(imageId);
    } catch (e) {
      // Ignore — this is a background convenience feature, not critical
    }
  };

  const isLiked = (id) => likedIds.has(id);
  const isSaved = (id) => savedIds.has(id);

  const value = {
    likedIds,
    savedIds,
    isLiked,
    isSaved,
    toggleLike,
    toggleBookmark,
    triggerDownload,
    downloadHistory,
    recentlyViewed,
    recordView
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};
