/**
 * Visual Vault - Vault Context
 *
 * Global state for the logged-in user's own images and folders —
 * everything on the "Studio" (personal vault) page reads from here
 * instead of each component fetching its own copy of the data.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const VaultContext = createContext(null);

export const VaultProvider = ({ children }) => {
  const { user } = useAuth();
  const [vaultImages, setVaultImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);

  // useCallback keeps this same function reference across re-renders
  // (as long as its dependencies don't change) — needed here because
  // the useEffect below depends on this function.
  const fetchVaultData = useCallback(async () => {
    if (!user) {
      setVaultImages([]);
      setFolders([]);
      return;
    }

    setLoading(true);
    try {
      // Fetching images and folders at the same time (in parallel)
      // instead of one after another — faster than two sequential awaits.
      const [imgRes, folderRes] = await Promise.all([
        api.images.getVaultImages({
          folderId: activeFolderId === 'all' ? undefined : activeFolderId,
          showTrash: showTrash ? 'true' : 'false'
        }),
        api.folders.getAll()
      ]);

      if (imgRes.success) setVaultImages(imgRes.data || []);
      if (folderRes.success) setFolders(folderRes.data || []);
    } catch (err) {
      console.error('Failed to load vault data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeFolderId, showTrash]);

  // Re-fetch whenever the user, folder filter, or trash view changes
  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  // Upload Asset (FormData via Multer)
  const uploadAsset = async (formData) => {
    const res = await api.images.upload(formData);
    if (res.success && res.data) {
      setVaultImages(prev => [res.data, ...prev]);
      fetchVaultData(); // Refresh folder counts
      setUploadModalOpen(false);
      return res.data;
    }
    throw new Error(res.message || 'Upload failed');
  };

  // Edit Asset metadata
  const updateAsset = async (id, data) => {
    const res = await api.images.update(id, data);
    if (res.success) {
      setVaultImages(prev => prev.map(img => (img._id === id ? { ...img, ...res.data } : img)));
      return res.data;
    }
    throw new Error(res.message || 'Update failed');
  };

  // Soft Delete (move to trash)
  const deleteAsset = async (id) => {
    const res = await api.images.delete(id);
    if (res.success) {
      setVaultImages(prev => prev.filter(img => img._id !== id));
      fetchVaultData();
    }
  };

  // Restore from trash
  const restoreAsset = async (id) => {
    const res = await api.images.restore(id);
    if (res.success) {
      setVaultImages(prev => prev.filter(img => img._id !== id));
      fetchVaultData();
    }
  };

  // Move Asset to folder
  const moveAsset = async (imageId, folderId) => {
    const res = await api.folders.moveAsset(imageId, folderId);
    if (res.success) {
      fetchVaultData();
    }
  };

  // Create Folder
  const createFolder = async (folderData) => {
    const res = await api.folders.create(folderData);
    if (res.success && res.data) {
      setFolders(prev => [...prev, { ...res.data, assetCount: 0 }]);
      setFolderModalOpen(false);
      return res.data;
    }
    throw new Error(res.message || 'Folder creation failed');
  };

  // Update Folder
  const updateFolder = async (id, folderData) => {
    const res = await api.folders.update(id, folderData);
    if (res.success) {
      setFolders(prev => prev.map(f => (f._id === id ? { ...f, ...res.data } : f)));
      setFolderModalOpen(false);
      setEditingFolder(null);
    }
  };

  // Delete Folder
  const deleteFolder = async (id) => {
    const res = await api.folders.delete(id);
    if (res.success) {
      setFolders(prev => prev.filter(f => f._id !== id));
      if (activeFolderId === id) setActiveFolderId('all');
      fetchVaultData();
    }
  };

  const value = {
    vaultImages,
    folders,
    activeFolderId,
    setActiveFolderId,
    showTrash,
    setShowTrash,
    loading,
    uploadModalOpen,
    setUploadModalOpen,
    folderModalOpen,
    setFolderModalOpen,
    editingFolder,
    setEditingFolder,
    fetchVaultData,
    uploadAsset,
    updateAsset,
    deleteAsset,
    restoreAsset,
    moveAsset,
    createFolder,
    updateFolder,
    deleteFolder
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
