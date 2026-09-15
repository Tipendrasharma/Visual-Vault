/**
 * Visual Vault - Edit Image Modal
 * Lets the owner update an image's title, description, category, and tags.
 */

import React, { useState } from 'react';
import { api } from '../services/api.js';
import { X, Check, Tag, Folder, FileText } from 'lucide-react';

const CATEGORIES = [
  'All Works',
  'Architecture',
  'Minimalism',
  'Automotive',
  '3D & CGI',
  'Street Photography',
  'Nature & Organic'
];

export default function EditImageModal({ image, isOpen, onClose, onUpdated }) {
  // IMPORTANT (React Rules of Hooks): every useState/useEffect call
  // must happen at the top of the component, in the same order on
  // every render — NEVER after an `if` or a conditional `return`.
  // Otherwise React can lose track of which state belongs to which
  // hook. That's why the `isOpen`/`image` check below comes AFTER
  // all the hooks, not before.
  const [title, setTitle] = useState(image?.title || '');
  const [description, setDescription] = useState(image?.description || '');
  const [category, setCategory] = useState(image?.category || 'Architecture');
  const [tags, setTags] = useState(Array.isArray(image?.tags) ? image.tags.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  if (!isOpen || !image) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess('');

    try {
      const tagList = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await api.images.update(image.id || image._id, {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagList
      });

      if (res.success) {
        setSuccess('Image updated in database successfully!');
        if (onUpdated) onUpdated(res.data);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(res.message || 'Failed to update image.');
      }
    } catch (err) {
      console.error('Image update error:', err);
      setError(err.message || 'Error updating image in database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
              Update Image in Database
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Edit master title, category, and searchable tags.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Preview Banner */}
        <div className="px-6 pt-5 flex items-center gap-4">
          <img
            src={image.thumbnailUrl || image.imageUrl}
            alt={image.title}
            className="w-16 h-16 rounded-xl object-cover border border-neutral-200 shadow-xs"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-neutral-900 truncate">{image.title}</p>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
              ID: {image.id || image._id}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" />
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Asset Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g. Cyberpunk Hypercar at Midnight"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black bg-white cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black leading-relaxed"
              placeholder="Detailed caption describing lighting, texture, and subject..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Search Tags (comma-separated)
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="car, sports car, night, neon, rain"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Accurate tags ensure images appear precisely when users search for keywords.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-neutral-600 hover:text-black rounded-full cursor-pointer"
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
                  Saving in DB...
                </>
              ) : (
                'Update in Database'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
