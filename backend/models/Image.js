/**
 * Visual Vault - Image Model
 * Represents images uploaded to personal vault or curated into the master archive.
 */

import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    imageUrl: { type: String, required: [true, 'Image URL is required'] },
    thumbnailUrl: { type: String, default: '' },
    tags: { type: [String], default: [] },
    category: { type: String, default: 'All Works' },
    source: { type: String, default: 'Visual Vault (Personal Upload)' },
    dimensions: { width: { type: Number, default: 1920 }, height: { type: Number, default: 1080 } },
    sizeBytes: { type: Number, default: 1024000 },
    fileType: { type: String, default: 'image/jpeg' },
    ownerId: { type: String, required: true },
    ownerName: { type: String, default: 'Vault Member' },
    ownerAvatar: { type: String, default: null },
    folderId: { type: String, default: null },
    downloadCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// If no thumbnail is given, fall back to the full image URL
imageSchema.pre('save', function () {
  if (!this.thumbnailUrl) this.thumbnailUrl = this.imageUrl;
});

export const ImageModel = mongoose.models.Image || mongoose.model('Image', imageSchema);

export const Image = {
  find: (query = {}) => ImageModel.find(query).sort({ createdAt: -1 }),
  findById: (id) => ImageModel.findById(id),
  create: (imageData) => ImageModel.create(imageData),
  findByIdAndUpdate: (id, updateData) => ImageModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after'}),
  deleteById: (id) => ImageModel.findByIdAndDelete(id)
};
