/**
 * Visual Vault - Auth Context
 *
 * This is "global state" for everything related to who's logged in.
 * Any component can call useAuth() to read the current user or the
 * login/signup/logout functions, without needing them passed down
 * as props from a parent component.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setStoredToken } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [authModalRole, setAuthModalRole] = useState('user'); // 'user' | 'creator'
  const [authNotice, setAuthNotice] = useState('');

  // useEffect with an empty [] dependency array runs exactly once,
  // right after the app first loads — this is where we check
  // "is there already a valid session?" (e.g. the user refreshed
  // the page but their cookie/token is still valid).
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.auth.getMe();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        setUser(null); // No active session — that's fine, just show as logged out
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.data) {
      setStoredToken(res.data.accessToken);
      setUser(res.data.user);
      setAuthModalOpen(false);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const signup = async (data) => {
    const res = await api.auth.signup(data);
    if (res.success && res.data) {
      setStoredToken(res.data.accessToken);
      setUser(res.data.user);
      setAuthModalOpen(false);
      return res.data.user;
    }
    throw new Error(res.message || 'Signup failed');
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore network error during logout
    } finally {
      setStoredToken(null);
      setUser(null);
      setAuthModalOpen(false);
      setAuthNotice('');
    }
  };

  const logoutAll = async () => {
    try {
      await api.auth.logoutAll();
    } catch (e) {
      // Ignore
    } finally {
      setStoredToken(null);
      setUser(null);
      setAuthModalOpen(false);
      setAuthNotice('');
    }
  };

  const updateUserProfile = async (profileData) => {
    const res = await api.auth.updateProfile(profileData);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Failed to update profile');
  };

  // Step 1 of password reset: ask the backend to generate a reset token
  // for this email. NOTE: until real email sending (Brevo) is wired up
  // on the backend, the token comes straight back in this response
  // instead of being emailed — see the TODO in authController.js.
  const forgotPassword = async (email) => {
    const res = await api.auth.forgotPassword(email);
    if (res.success) {
      return res.data; // contains { resetToken } for now
    }
    throw new Error(res.message || 'Failed to process password reset request');
  };

  // Step 2 of password reset: submit the token + new password
  const resetPassword = async (token, newPassword) => {
    const res = await api.auth.resetPassword({ token, newPassword });
    if (res.success) {
      return res;
    }
    throw new Error(res.message || 'Failed to reset password');
  };

  const openAuthModal = (mode = 'login', initialRole = 'user', notice = '') => {
    setAuthModalMode(mode);
    setAuthModalRole(initialRole);
    setAuthNotice(notice);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthNotice('');
  };

  const value = {
    user,
    role: user ? user.role : 'guest',
    isAuthenticated: Boolean(user),
    isCreator: user?.role === 'creator' || user?.role === 'admin',
    isUser: user?.role === 'user',
    loading,
    login,
    signup,
    logout,
    logoutAll,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    authModalOpen,
    authModalMode,
    authModalRole,
    authNotice,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode,
    setAuthModalRole,
    setAuthNotice
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
