/**
 * Visual Vault - Folder Management Modal
 *
 * This one modal handles BOTH creating a new folder and editing an
 * existing one — decided by whether an `editFolder` prop was passed
 * in. This is a common React pattern: reuse one component for two
 * closely related jobs instead of writing two nearly-identical ones.
 */

import React, { useState } from 'react';
import { X, FolderPlus, Image as ImageIcon, Check } from 'lucide-react';
import { useVault } from '../context/VaultContext.jsx';

export default function FolderModal({ onClose, editFolder = null }) {
  const { createFolder, updateFolder } = useVault();
  const [name, setName] = useState(editFolder ? editFolder.name : '');
  const [coverImage, setCoverImage] = useState(
    editFolder ? editFolder.coverImage : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const presetCovers = [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  ];

  // e.preventDefault() stops the browser's default "reload the page
  // on form submit" behavior, so React can handle the submission
  // with JavaScript instead (calling our API).
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a folder name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Same form, two possible actions — decided by editFolder
      if (editFolder) {
        await updateFolder(editFolder._id, { name: name.trim(), coverImage });
      } else {
        await createFolder({ name: name.trim(), coverImage });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-neutral-800" />
            <h2 className="text-base font-bold text-neutral-900">
              {editFolder ? 'Edit Folder' : 'Create New Vault Folder'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Folder Name *</label>
            <input
              type="text"
              placeholder="e.g. Minimalist Workspaces"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-400 focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-2">Select Folder Cover</label>
            <div className="grid grid-cols-4 gap-2">
              {presetCovers.map((cUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverImage(cUrl)}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    coverImage === cUrl ? 'border-black ring-2 ring-black/20' : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={cUrl} alt="Cover option" className="w-full h-full object-cover" />
                  {coverImage === cUrl && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-black font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-semibold rounded-full shadow cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editFolder ? 'Update Folder' : 'Create Folder'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
