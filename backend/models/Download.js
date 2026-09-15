/**
 * Visual Vault - Download Model
 * Records image download history for analytics and personal user profile logs.
 */

import mongoose from 'mongoose';

const downloadSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'dn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
    userId: { type: String, required: true },
    imageId: { type: String, required: true }
  },
  { timestamps: true }
);

export const DownloadModel = mongoose.models.Download || mongoose.model('Download', downloadSchema);

export const Download = {
  find: (query = {}) => DownloadModel.find(query).sort({ createdAt: -1 }),
  create: (data) => DownloadModel.create(data),
  countDocuments: (query = {}) => DownloadModel.countDocuments(query)
};
