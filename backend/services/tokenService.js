/**
 * Visual Vault - Token Service
 * Handles generation, verification, rotation, and revocation of JWT access and refresh tokens.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_CONFIG } from '../config/jwt.js';
import { RefreshToken } from '../models/RefreshToken.js';

export const tokenService = {
  // Generates a short-lived access token for stateless API requests
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_CONFIG.accessSecret,
      { expiresIn: JWT_CONFIG.accessExpiresIn }
    );
  },

  // Generates a long-lived refresh token. Includes a random `jti`
  // (JWT ID) so that two tokens issued for the same user in the same
  // second are never byte-identical — without this, a duplicate-key
  // error can happen in the database (the `token` field is unique).
  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user._id,
        jti: crypto.randomBytes(16).toString('hex')
      },
      JWT_CONFIG.refreshSecret,
      { expiresIn: JWT_CONFIG.refreshExpiresIn }
    );
  },

  // Verifies the access token from Authorization header or cookie
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_CONFIG.accessSecret);
    } catch (error) {
      return null;
    }
  },

  // Verifies the refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_CONFIG.refreshSecret);
    } catch (error) {
      return null;
    }
  },

  // Stores refresh token in database for session tracking
  async saveRefreshToken(userId, token) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return await RefreshToken.create({
      userId,
      token,
      expiresAt
    });
  },

  // Removes a specific refresh token (Single device logout)
  async removeRefreshToken(token) {
    return await RefreshToken.deleteOne({ token });
  },

  // Removes all refresh tokens for a user (Logout from all devices)
  async removeAllUserTokens(userId) {
    return await RefreshToken.deleteMany({ userId });
  },

  // Validates if refresh token exists in DB and is not expired
  async isRefreshTokenValid(token) {
    const record = await RefreshToken.findOne({ token });
    if (!record) return false;
    return new Date(record.expiresAt) > new Date();
  }
};