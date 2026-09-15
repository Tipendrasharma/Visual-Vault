/**
 * Visual Vault - Authentication Modal Component
 * One modal, three modes: Sign In, Sign Up, and Forgot/Reset Password.
 * Which fields show depends entirely on `authModalMode`.
 */

import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal() {
  const { 
    authModalOpen, 
    authModalMode, 
    authModalRole, 
    authNotice,
    closeAuthModal, 
    setAuthModalMode, 
    login, 
    signup, 
    forgotPassword,
    resetPassword,
    user, 
    isAuthenticated, 
    updateUserProfile 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset-password step 2 fields: once forgotPassword succeeds, the
  // modal switches to 'reset' mode and shows these instead.
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (authModalRole) {
      setRole(authModalRole);
    }
  }, [authModalRole, authModalOpen]);

  // Cleanly wipe any stale success messages, congratulations, errors, or passwords
  // whenever modal opens/closes or when user logs out/in
  useEffect(() => {
    setError('');
    setSuccessMessage('');
    setPassword('');
    setShowPassword(false);
    setResetToken('');
    setNewPassword('');
    if (!isAuthenticated) {
      setEmail('');
      setName('');
    }
  }, [authModalOpen, isAuthenticated]);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setError('');
    setSuccessMessage('');
    setPassword('');
    setShowPassword(false);
    closeAuthModal();
  };

  const handleInstantUpgrade = async () => {
    try {
      setLoading(true);
      setError('');
      await updateUserProfile({ role: 'creator' });
      setSuccessMessage('🎉 Congratulations! Your account has been upgraded to Creator. Uploading is now enabled.');
      setTimeout(() => {
        setSuccessMessage('');
        closeAuthModal();
      }, 1400);
    } catch (err) {
      setError(err.message || 'Failed to upgrade account to creator.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else if (authModalMode === 'signup') {
        await signup({ name, email, password, role });
      } else if (authModalMode === 'forgot') {
        // Step 1: request a reset token for this email
        const data = await forgotPassword(email);
        // The backend doesn't send a real email yet (see the TODO in
        // authController.js), so for now we show the token directly
        // and move to the "enter new password" step.
        setResetToken(data?.resetToken || '');
        setSuccessMessage(
          data?.resetToken
            ? `Reset token generated: ${data.resetToken}. Enter it below along with your new password.`
            : 'If an account exists with this email, reset instructions have been generated.'
        );
        setAuthModalMode('reset');
      } else if (authModalMode === 'reset') {
        // Step 2: submit the token + new password together
        await resetPassword(resetToken, newPassword);
        setSuccessMessage('Password updated! Please sign in with your new password.');
        setPassword('');
        setNewPassword('');
        setTimeout(() => setAuthModalMode('login'), 1200);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const isCreatorSignup = authModalMode === 'signup' && role === 'creator';

  return (
    <div 
      id="auth-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div 
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200"
      >
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-100">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => {
                setAuthModalMode('login');
                setError('');
                setSuccessMessage('');
                setShowPassword(false);
              }}
              className={`text-sm font-bold pb-2 transition-colors cursor-pointer ${
                authModalMode === 'login' ? 'text-black border-b-2 border-black' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthModalMode('signup');
                setError('');
                setSuccessMessage('');
                setShowPassword(false);
              }}
              className={`text-sm font-bold pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                authModalMode === 'signup' ? 'text-black border-b-2 border-black' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {isCreatorSignup ? (
                <span>Creator Signup</span>
              ) : (
                <span>Join Archive</span>
              )}
            </button>
          </div>

          <button onClick={handleClose} className="p-1 rounded-full text-neutral-400 hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Prompt Notice (e.g. Download/Like requires login) */}
        {authNotice && (
          <div className="mx-6 mt-3.5 px-3.5 py-2.5 bg-black text-white rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <p className="text-xs font-medium leading-relaxed">{authNotice}</p>
          </div>
        )}

        {/* Creator Banner when in creator signup mode */}
        {isCreatorSignup && (
          <div className="mx-6 mt-3.5 px-3.5 py-2 bg-neutral-50 border border-neutral-200/70 rounded-xl text-xs">
            <p className="text-xs text-neutral-600">
              <span className="font-semibold text-neutral-900">Creator Signup:</span> Upload and showcase your visual works.
            </p>
          </div>
        )}

        {/* Instant Upgrade Card for already logged-in users */}
        {isAuthenticated && user?.role === 'user' && authModalMode === 'signup' && (
          <div className="mx-6 mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="text-xs font-bold text-neutral-800">
                Currently logged in as: <span className="font-semibold text-neutral-900">{user.name}</span>
              </p>
            </div>
            <p className="text-[11px] text-neutral-600 mb-3">
              You already have an active account. You can upgrade it to a Creator account with one click to immediately unlock asset uploads.
            </p>
            <button
              type="button"
              onClick={handleInstantUpgrade}
              disabled={loading}
              className="w-full py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Upgrading...' : 'Upgrade Current Account to Creator'}</span>
            </button>
            <div className="relative my-3 text-center">
              <div className="border-t border-neutral-200"></div>
              <span className="relative -top-2.5 bg-neutral-50 px-2 text-[10px] text-neutral-400 font-medium">
                OR REGISTER NEW CREATOR ACCOUNT BELOW
              </span>
            </div>
          </div>
        )}

        {error && (
          <div 
            id="auth-modal-error-banner"
            className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div 
            id="auth-modal-success-banner"
            className="mx-6 mt-3.5 p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span id="auth-modal-success-text" className="font-medium leading-relaxed">
              {successMessage}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          
          {authModalMode === 'signup' && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {authModalMode !== 'reset' && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {(authModalMode === 'login' || authModalMode === 'signup') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-neutral-700">Password</label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('forgot')}
                    className="text-[11px] text-neutral-500 hover:text-black cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 focus:outline-none cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {authModalMode === 'reset' && (
            <>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Reset Token</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Paste the token you received"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {authModalMode === 'signup' && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Select Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
              >
                <option value="user">User / Collector (Explore, Bookmark & Curate)</option>
                <option value="creator">Creator / Photographer (Upload & Publish)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-black hover:bg-neutral-800 text-white font-semibold rounded-full shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {authModalMode === 'login' && 'Sign In to Vault'}
                  {authModalMode === 'signup' && (role === 'creator' ? 'Create Creator Account' : 'Create Account')}
                  {authModalMode === 'forgot' && 'Send Reset Token'}
                  {authModalMode === 'reset' && 'Reset Password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {(authModalMode === 'forgot' || authModalMode === 'reset') && (
            <button
              type="button"
              onClick={() => setAuthModalMode('login')}
              className="w-full text-center text-xs text-neutral-500 hover:text-black pt-1 cursor-pointer"
            >
              Back to Sign In
            </button>
          )}

        </form>

      </div>
    </div>
  );
}
