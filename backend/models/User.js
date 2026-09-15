/**
 * Visual Vault - User Model
 * Defines user schema with roles, password hashing, and verification fields.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    },
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [50, 'Name cannot exceed 50 characters'] },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: [true, 'Password is required'] },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    bio: { type: String, default: 'Visual Vault creator & image curator.', maxlength: [300, 'Bio cannot exceed 300 characters'] },
    role: { type: String, enum: ['user', 'creator'], default: 'user' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    cameraGear: { type: String, default: '' },
    badge: { type: String, default: 'Creator' },
    followerCount: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    isEmailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

export const User = {
  findOne: (query) => UserModel.findOne(query),
  findById: (id) => UserModel.findById(id),
  find: (query = {}) => UserModel.find(query),
  create: (userData) => UserModel.create(userData),
  findByIdAndUpdate: (id, updateData, options = {}) => UserModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after', ...options }),
  deleteById: (id) => UserModel.findByIdAndDelete(id)
};
