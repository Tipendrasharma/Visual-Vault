/**
 * Visual Vault - RefreshToken Model
 * Manages active refresh tokens for session rotation and multi-device logout.
 */

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'rtk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
    token: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export const RefreshTokenModel = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);

export const RefreshToken = {
  findOne: (query) => RefreshTokenModel.findOne(query),
  create: (data) => RefreshTokenModel.create(data),
  deleteOne: (query) => RefreshTokenModel.deleteOne(query),
  deleteMany: (query) => RefreshTokenModel.deleteMany(query)
};
