/**
 * Visual Vault - Studio Vault Page
 * Personal Asset Management Workspace:
 * - Folder creation, editing, deleting
 * - Asset movement between folders
 * - Asset metadata editing (Title, Description, Tags, Category)
 * - Soft-delete to Trash and Trash restoration
 */

import React, { useState } from 'react';
import { useVault } from '../context/VaultContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ImageDetailModal from '../components/ImageDetailModal.jsx';
import { 
  FolderPlus, Upload, Trash2, RotateCcw, Folder, Edit3, 
  MoreVertical, Check, Layers, AlertCircle 
} from 'lucide-react';
import { formatBytes } from '../utils/formatters.js';

export default function StudioVaultPage() {
  const { user, isCreator, openAuthModal } = useAuth();
  // Almost everything this page needs — the actual images, folders,
  // and the functions to change them — comes from VaultContext rather
  // than being fetched here directly. This page is mostly just the UI
  // on top of state that already lives in Context.
  const { 
    vaultImages, 
    folders, 
    activeFolderId, 
    setActiveFolderId, 
    showTrash, 
    setShowTrash, 
    loading, 
    setUploadModalOpen, 
    setFolderModalOpen, 
    setEditingFolder, 
    deleteAsset, 
    restoreAsset, 
    moveAsset, 
    updateAsset, 
    deleteFolder 
  } = useVault();

  const [activeModalImage, setActiveModalImage] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [movingAssetId, setMovingAssetId] = useState(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-800">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2 font-['Plus_Jakarta_Sans']">
          Personal Studio Vault
        </h2>
        <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
          Sign in or create a free membership to organize your high-resolution assets into folders, manage metadata, and safeguard your raw files.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow cursor-pointer"
        >
          Sign In to Access Vault
        </button>
      </div>
    );
  }

  const activeFolder = folders.find(f => f._id === activeFolderId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Vault Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
            <span>Studio Asset Management</span>
            <span>•</span>
            <span className="text-neutral-700">{user.name}'s Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">
            {showTrash ? 'Vault Trash Bin' : activeFolder ? activeFolder.name : 'All Vault Assets'}
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              showTrash 
                ? 'bg-neutral-900 text-white border-neutral-900' 
                : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{showTrash ? 'Exit Trash' : 'View Trash'}</span>
          </button>

          {!showTrash && (
            <>
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setFolderModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-all cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Folder</span>
              </button>

              {isCreator || user?.role === 'admin' ? (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-black hover:bg-neutral-800 text-white shadow transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Asset</span>
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('signup', 'creator')}
                  className="flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-black hover:bg-neutral-800 text-white shadow transition-all cursor-pointer"
                >
                  <span>Become a Creator to Upload</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Folders Bar (When not in Trash) */}
      {!showTrash && (
        <div className="py-4 border-b border-neutral-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFolderId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFolderId === 'all'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            All Assets
          </button>

          {folders.map(f => (
            <div key={f._id} className="relative group shrink-0 flex items-center">
              <button
                onClick={() => setActiveFolderId(f._id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFolderId === f._id
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>{f.name}</span>
                <span className="text-[10px] opacity-70">({f.assetCount || 0})</span>
              </button>

              {/* Folder Actions hover buttons */}
              <div className="hidden group-hover:flex items-center gap-1 ml-1 bg-white border border-neutral-200 rounded-full px-1.5 py-0.5 shadow-sm">
                <button
                  onClick={() => {
                    setEditingFolder(f);
                    setFolderModalOpen(true);
                  }}
                  className="p-1 hover:text-black text-neutral-400 cursor-pointer"
                  title="Rename folder"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete folder "${f.name}"? Images inside will be moved to root.`)) {
                      deleteFolder(f._id);
                    }
                  }}
                  className="p-1 hover:text-red-600 text-neutral-400 cursor-pointer"
                  title="Delete folder"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assets Grid */}
      <div className="pt-6">
        {vaultImages.length === 0 ? (
          <div className="py-20 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
            <p className="text-sm font-semibold text-neutral-800 mb-1">
              {showTrash ? 'Trash bin is empty.' : 'No assets in this vault view.'}
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              {showTrash ? 'Soft-deleted assets will appear here before permanent clearance.' : 'Upload photos with Multer or organize assets into folders.'}
            </p>
            {!showTrash && (
              isCreator || user?.role === 'admin' ? (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow transition-all cursor-pointer"
                >
                  Upload First Asset
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('signup', 'creator')}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-full shadow transition-all cursor-pointer inline-flex items-center"
                >
                  <span>Become a Creator to Upload</span>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {vaultImages.map(img => (
              <div
                key={img._id}
                className="group relative bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Media Container */}
                <div 
                  onClick={() => setActiveModalImage(img)}
                  className="relative aspect-[4/3] bg-neutral-100 overflow-hidden cursor-pointer"
                >
                  <img
                    src={img.thumbnailUrl || img.imageUrl}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md">
                    {img.category || 'Asset'}
                  </div>
                </div>

                {/* Information & Action bar */}
                <div className="p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-neutral-900 truncate max-w-[70%]">
                      {img.title}
                    </h3>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {img.dimensions?.width}×{img.dimensions?.height}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    {showTrash ? (
                      <button
                        onClick={() => restoreAsset(img._id)}
                        className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <>
                        {/* Move Folder Select */}
                        <select
                          value={img.folderId || ''}
                          onChange={(e) => moveAsset(img._id, e.target.value)}
                          className="text-[11px] bg-neutral-100 rounded-lg px-2 py-1 border border-neutral-200 text-neutral-700 focus:outline-none max-w-[120px] cursor-pointer"
                        >
                          <option value="">Root Vault</option>
                          {folders.map(f => (
                            <option key={f._id} value={f._id}>{f.name}</option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingAsset(img)}
                            className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 cursor-pointer"
                            title="Edit metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deleteAsset(img._id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Move to trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-200 space-y-4 text-xs">
            <h3 className="text-base font-bold text-neutral-900">Edit Asset Metadata</h3>
            
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Title</label>
              <input
                type="text"
                value={editingAsset.title}
                onChange={(e) => setEditingAsset({ ...editingAsset, title: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Category</label>
              <select
                value={editingAsset.category}
                onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer"
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
              <label className="block font-semibold text-neutral-700 mb-1">Tags</label>
              <input
                type="text"
                value={Array.isArray(editingAsset.tags) ? editingAsset.tags.join(', ') : editingAsset.tags}
                onChange={(e) => setEditingAsset({ ...editingAsset, tags: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 font-semibold text-neutral-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateAsset(editingAsset._id, {
                    title: editingAsset.title,
                    category: editingAsset.category,
                    tags: editingAsset.tags
                  });
                  setEditingAsset(null);
                }}
                className="px-5 py-2 bg-black text-white font-semibold rounded-full shadow cursor-pointer hover:bg-neutral-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Preview Modal */}
      {activeModalImage && (
        <ImageDetailModal
          image={activeModalImage}
          onClose={() => setActiveModalImage(null)}
        />
      )}

    </div>
  );
}
