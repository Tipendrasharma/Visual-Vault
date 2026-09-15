/**
 * Visual Vault - Edit Profile Modal
 * Allows updating user profile and creator details directly in the backend database:
 * Name, role, bio, avatar, location, website, social handles, camera gear, and badge.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  X, Check, User, Camera, Globe, 
  Instagram, Twitter, MapPin, Image as ImageIcon 
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
];

export default function EditProfileModal({ isOpen, onClose, onUpdated }) {
  const { user, updateUserProfile } = useAuth();

  // Instead of one useState per field (10 separate variables), all
  // form fields live in a single object. handleChange below reads
  // the input's `name` attribute to know which key to update — this
  // scales much better as a form grows.
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || 'user',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    location: user?.location || '',
    website: user?.website || '',
    instagram: user?.instagram || '',
    twitter: user?.twitter || '',
    cameraGear: user?.cameraGear || '',
    badge: user?.badge || (user?.role === 'creator' ? 'Master Creator' : 'Curator')
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // The spread (...prev) keeps every existing field as-is, and only
  // overwrites the one field the user just typed into — this is the
  // standard way to update part of an object in React state.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      badge: newRole === 'creator' ? 'Master Creator' : 'Curator'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      await updateUserProfile(formData);
      setSuccessMsg('Profile updated in database successfully!');
      if (onUpdated) onUpdated();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update database profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
              Edit Profile & Creator Details
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Updates your identity and gear specs directly in the database.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" />
              {successMsg}
            </div>
          )}

          {/* Role Switcher */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Account Role / Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('user')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.role === 'user'
                    ? 'border-black bg-neutral-900 text-white shadow-sm'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                }`}
              >
                <User className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Collector / User</p>
                  <p className={`text-[11px] mt-0.5 ${formData.role === 'user' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Browse, curate, like, and download master assets.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('creator')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.role === 'creator'
                    ? 'border-purple-600 bg-purple-950 text-white shadow-sm'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                }`}
              >
                <Camera className={`w-5 h-5 mt-0.5 ${formData.role === 'creator' ? 'text-purple-400' : 'text-purple-600'}`} />
                <div>
                  <p className="text-xs font-bold">Verified Creator</p>
                  <p className={`text-[11px] mt-0.5 ${formData.role === 'creator' ? 'text-purple-200' : 'text-neutral-500'}`}>
                    Publish master RAW photography & public creator portfolio.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Info: Name & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. Berlin, Germany"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Creator Bio / Artist Statement
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black leading-relaxed"
              placeholder="Tell collectors and creators about your visual style, vision, and focus..."
            />
          </div>

          {/* Avatar URL & Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Avatar Image URL
            </label>
            <div className="flex items-center gap-3 mb-2">
              <img
                src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="Avatar preview"
                className="w-12 h-12 rounded-full object-cover border border-neutral-300 shadow-xs flex-shrink-0"
              />
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black font-mono text-[11px]"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400">Presets:</span>
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar: url }))}
                  className="w-7 h-7 rounded-full overflow-hidden border border-neutral-300 hover:scale-110 transition-transform cursor-pointer"
                >
                  <img src={url} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Creator Equipment & Gear */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Camera & Equipment Gear
            </label>
            <div className="relative">
              <Camera className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                name="cameraGear"
                value={formData.cameraGear}
                onChange={handleChange}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g. Sony A7R V, Hasselblad H6D-100c & Leica M11"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Portfolio Website
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://yoursite.art"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Instagram Handle
              </label>
              <div className="relative">
                <Instagram className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="@yourhandle"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Twitter / X Handle
              </label>
              <div className="relative">
                <Twitter className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="@yourhandle"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-black rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving in Database...
                </>
              ) : (
                'Save Changes in Database'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
