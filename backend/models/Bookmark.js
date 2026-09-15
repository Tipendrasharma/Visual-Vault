/**
 * Visual Vault - Bookmark Model
 * Tracks saved / bookmarked images for authenticated users.
 */

import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
    userId: { type: String, required: true },
    imageId: { type: String, required: true },
},
  { timestamps: true }
);

export const BookmarkModel = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);

export const Bookmark = {
  find: (query = {}) => BookmarkModel.find(query),
  findOne: (query) => BookmarkModel.findOne(query),
  create: (data) => BookmarkModel.create(data),
  deleteOne: (query) => BookmarkModel.deleteOne(query),
  countDocuments: (query = {}) => BookmarkModel.countDocuments(query)
};
