/**
 * Visual Vault - Upload Modal Component
 * Lets a Creator upload a real image file (sent to the backend as
 * multipart/form-data, which Multer parses) — or pick a sample image
 * URL instead of uploading a file, for quickly trying the feature out.
 */

import React, { useState } from 'react';
import { X, UploadCloud, Image as ImageIcon, Folder, Check, AlertCircle } from 'lucide-react';
import { useVault } from '../context/VaultContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function UploadModal({ onClose }) {
  const { uploadAsset, folders } = useVault();
  const { user, isCreator, openAuthModal } = useAuth();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('3D & CGI');
  const [tags, setTags] = useState('');
  const [folderId, setFolderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sample presets: choosing one just sets an existing image URL as
  // the "customImageUrl" instead of uploading a new file — a quick
  // way to try the upload flow without needing your own photo ready.
  const samplePresets = [
    {
      title: 'Architectural Shadow Geometry',
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=85',
      category: 'Architecture',
      tags: 'architecture, geometry, minimalist, concrete'
    },
    {
      title: 'Minimal Titanium Desk Clock',
      url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=1600&auto=format&fit=crop&q=85',
      category: 'Minimalism',
      tags: 'minimalism, design, industrial, clock'
    },
    {
      title: 'Volcanic Black Sand Beach Iceland',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=85',
      category: 'Nature & Landscape',
      tags: 'nature & landscape, iceland, black sand, ocean'
    }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP).');
        return;
      }
      setFile(selectedFile);
      // createObjectURL makes a temporary local preview URL from the
      // file sitting in the browser — no upload has happened yet,
      // this is purely so the user can see what they picked.
      setPreviewUrl(URL.createObjectURL(selectedFile));
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setErrorMessage('');
    }
  };

  const handleSelectPreset = (preset) => {
    setFile(null);
    setPreviewUrl(preset.url);
    setTitle(preset.title);
    setCategory(preset.category);
    setTags(preset.tags);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previewUrl && !file) {
      setErrorMessage('Please select an image file or choose a preset asset.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter an image title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // FormData is required (instead of a plain JS object) whenever
      // we're sending an actual file — this is what lets Multer on
      // the backend read it as multipart/form-data.
      const formData = new FormData();
      if (file) {
        formData.append('image', file);
      } else {
        formData.append('customImageUrl', previewUrl);
      }
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', tags);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      await uploadAsset(formData);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Upload to Personal Vault</h2>
            <p className="text-xs text-neutral-500">Processed through Multer & ImageKit storage pipeline</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isCreator && user?.role !== 'admin' ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Creator Account Required</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
              Only registered Creators and Photographers can publish visual works to Visual Vault.
            </p>
            <button
              onClick={() => {
                onClose();
                openAuthModal('signup', 'creator');
              }}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow cursor-pointer inline-flex items-center"
            >
              <span>Become a Creator</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* File Picker or Drag Zone */}
          {!previewUrl ? (
            <div className="relative border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-neutral-50 hover:bg-neutral-100/60">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-800">
                Click or drag & drop high-res image
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Supports JPG, PNG, WEBP up to 10MB
              </p>

              {/* Sample Presets */}
              <div className="mt-4 pt-4 border-t border-neutral-200/80">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                  Or pick a sample studio shot:
                </span>
                <div className="flex justify-center gap-2">
                  {samplePresets.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectPreset(p)}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-neutral-200 border border-neutral-300 rounded-lg text-neutral-700 font-medium transition-colors cursor-pointer"
                    >
                      {p.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 h-48 flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl('');
                }}
                className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-white rounded-full backdrop-blur-sm text-xs flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 mb-1">Asset Title *</label>
              <input
                type="text"
                placeholder="e.g. Modernist Concrete Facade at Dawn"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none cursor-pointer"
              >
                <option value="All Works">All Works</option>
                <option value="Nature & Landscape">Nature & Landscape</option>
                <option value="Architecture">Architecture</option>
                <option value="Street & Urban">Street & Urban</option>
                <option value="3D & CGI">3D & CGI</option>
                <option value="Minimalism">Minimalism</option>
                <option value="Portraits">Portraits</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Assign to Folder</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none cursor-pointer"
              >
                <option value="">Root Vault (No Folder)</option>
                {folders.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. architecture, brutalism, modern, raw"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 mb-1">Description (Optional)</label>
              <textarea
                placeholder="Add camera notes, location, or stylistic commentary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none"
              />
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Storing in Vault...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save to Vault</span>
                </>
              )}
            </button>
          </div>

        </form>
        )}

      </div>
    </div>
  );
}
