/**
 * Visual Vault - API Client Service
 * Centralized fetch client communicating with backend Express REST endpoints.
 * Handles JSON and FormData payloads, cookies, and authorization headers.
 *
 * Note on token storage: the short-lived access token is kept in
 * localStorage here so it can be attached to Authorization headers.
 * The long-lived refresh token, which matters far more if stolen,
 * stays in an HTTP-only cookie set by the backend and is never
 * touched by this file — a script running on the page (e.g. via an
 * XSS bug) could read this access token, but only for its 15-minute
 * lifetime, and could not extend the session on its own.
 */

const BASE_URL = '/api';

let accessToken = localStorage.getItem('vv_access_token') || null;

export const setStoredToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('vv_access_token', token);
  } else {
    localStorage.removeItem('vv_access_token');
  }
};

export const getStoredToken = () => accessToken;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { ...options.headers };

  // Attach token if available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Set JSON content-type unless sending FormData (Multer upload)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Always include HTTP cookies for refresh tokens
  };

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({ success: false, message: 'Server response error' }));

  if (!res.ok) {
    // If unauthorized and not already refreshing, attempt session recovery
    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.accessToken) {
          setStoredToken(refreshData.data.accessToken);
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          const retryRes = await fetch(url, { ...config, headers });
          return await retryRes.json();
        }
      } catch (err) {
        // Refresh failed, clear session
        setStoredToken(null);
      }
    }

    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth APIs
  auth: {
    signup: (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => request('/auth/me', { method: 'GET' }),
    updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
    getCreator: (id) => request(`/auth/creators/${id}`, { method: 'GET' }),
    getCreators: () => request('/auth/creators', { method: 'GET' }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
    refreshToken: () => request('/auth/refresh', { method: 'POST' }),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) })
  },

  // Multi-Provider Discovery APIs
  discovery: {
    search: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/discovery/search?${query}`, { method: 'GET' });
    },
    getTrending: () => request('/discovery/trending', { method: 'GET' }),
    getProviders: () => request('/discovery/providers', { method: 'GET' }),
    getExploreSections: () => request('/discovery/explore', { method: 'GET' })
  },

  // Personal Vault Asset APIs
  images: {
    getVaultImages: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/images?${query}`, { method: 'GET' });
    },
    getById: (id) => request(`/images/${id}`, { method: 'GET' }),
    upload: (formData) => request('/images/upload', { method: 'POST', body: formData }),
    update: (id, data) => request(`/images/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/images/${id}`, { method: 'DELETE' }),
    restore: (id) => request(`/images/${id}/restore`, { method: 'POST' }),
    // Takes the FULL image object (not just an id) — the backend needs
    // title/imageUrl/tags/etc. to create a vault record for Pixabay/Pexels
    // images the first time they're downloaded (see getOrCreateImage in
    // socialController.js). Sending only an id here was the cause of
    // download history never being recorded.
    download: (image) => {
      const id = image.id || image._id;
      return request(`/images/${id}/download`, { method: 'POST', body: JSON.stringify({ image }) });
    }
  },

  // Folder Organization APIs
  folders: {
    getAll: () => request('/folders', { method: 'GET' }),
    create: (data) => request('/folders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/folders/${id}`, { method: 'DELETE' }),
    moveAsset: (imageId, folderId) => request('/folders/move-asset', { method: 'POST', body: JSON.stringify({ imageId, folderId }) })
  },

  // Social & Engagement APIs
  social: {
    // Sends the FULL image object — same reason as images.download above:
    // the backend needs it to upsert Pixabay/Pexels images into the vault
    // the first time they're liked/saved.
    toggleLike: (image) => request('/social/likes/toggle', { method: 'POST', body: JSON.stringify({ image }) }),
    getUserLikes: () => request('/social/likes', { method: 'GET' }),
    toggleBookmark: (image) => request('/social/bookmarks/toggle', { method: 'POST', body: JSON.stringify({ image }) }),
    getUserBookmarks: () => request('/social/bookmarks', { method: 'GET' }),
    getComments: (imageId) => request(`/social/comments/${imageId}`, { method: 'GET' }),
    addComment: (imageId, content) => request('/social/comments', { method: 'POST', body: JSON.stringify({ imageId, content }) }),
    addReply: (commentId, content) => request(`/social/comments/${commentId}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),
    deleteComment: (commentId) => request(`/social/comments/${commentId}`, { method: 'DELETE' }),
    getDownloadHistory: () => request('/social/downloads', { method: 'GET' }),
    addRecentlyViewed: (imageId) => request('/social/recently-viewed', { method: 'POST', body: JSON.stringify({ imageId }) }),
    getRecentlyViewed: () => request('/social/recently-viewed', { method: 'GET' })
  }
};