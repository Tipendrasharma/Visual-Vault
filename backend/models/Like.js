/**
 * Visual Vault - Like Model
 * Tracks user likes for images.
 */

import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'lk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
    userId: { type: String, required: true },
    imageId: { type: String, required: true }
  },
  { timestamps: true }
);

export const LikeModel = mongoose.models.Like || mongoose.model('Like', likeSchema);

export const Like = {
  find: (query = {}) => LikeModel.find(query),
  findOne: (query) => LikeModel.findOne(query),
  create: (data) => LikeModel.create(data),
  deleteOne: (query) => LikeModel.deleteOne(query),
  countDocuments: (query = {}) => LikeModel.countDocuments(query)
};
