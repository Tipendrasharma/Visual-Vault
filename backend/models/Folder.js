/**
 * Visual Vault - Folder Model
 * Allows users to organize vault assets into custom folders with covers.
 */

import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'fld_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
    name: { type: String, required: [true, 'Folder name is required'], trim: true },
    coverImage: { type: String, default: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
    userId: { type: String, required: true }
  },
  { timestamps: true }
);

export const FolderModel = mongoose.models.Folder || mongoose.model('Folder', folderSchema);

export const Folder = {
  find: (query = {}) => FolderModel.find(query).sort({ createdAt: -1 }),
  findById: (id) => FolderModel.findById(id),
  create: (folderData) => FolderModel.create(folderData),
  findByIdAndUpdate: (id, updateData) => FolderModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' }),
  deleteById: (id) => FolderModel.findByIdAndDelete(id)
};
