/**
 * Visual Vault - Auth Controller
 *
 * This file handles everything related to "who is this user" —
 * signup, login, logout, refreshing sessions, and password reset.
 *
 * Key concepts used here (for learning):
 * - bcrypt: turns a plain password into a scrambled "hash" that can't be
 *   reversed back into the password. We never store the real password.
 * - JWT (JSON Web Token): a signed piece of text the server gives the
 *   browser after login, proving "this request really is from this user"
 *   without the server needing to look up a session every time.
 * - Access token vs Refresh token: the access token is short-lived
 *   (15 min) and sent with every request. The refresh token is long-lived
 *   (7 days) and is only used to get a new access token when the old
 *   one expires — so if an access token leaks, it's only dangerous for
 *   15 minutes.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Image } from '../models/Image.js';
import { isDummyUser } from '../utils/isDummyUser.js';
import { tokenService } from '../services/tokenService.js';
import { JWT_CONFIG } from '../config/jwt.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// Turns a full Mongoose user document into the "safe" shape we send to
// the frontend — this makes sure passwordHash never accidentally leaks out.
export function formatUserResponse(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    avatar: user.avatar,
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    instagram: user.instagram || '',
    twitter: user.twitter || '',
    cameraGear: user.cameraGear || '',
    badge: user.badge || (user.role === 'creator' ? 'Master Creator' : 'Member'),
    followerCount: user.followerCount || 0,
    totalViews: user.totalViews || 0,
    totalDownloads: user.totalDownloads || 0,
    isEmailVerified: user.isEmailVerified || false,
    createdAt: user.createdAt
  };
}

// Small helper: after a successful login/signup, this creates a fresh
// access + refresh token pair, saves the refresh token, and sets both
// as secure cookies. Used by signup, login, and refresh.
async function issueTokens(res, user) {
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken(user);

  await tokenService.saveRefreshToken(user._id, refreshToken);

  res.cookie('refreshToken', refreshToken, JWT_CONFIG.cookieOptions);
  res.cookie('accessToken', accessToken, { ...JWT_CONFIG.cookieOptions, maxAge: 15 * 60 * 1000 });

  return accessToken;
}

export const authController = {
  // 1. Signup — create a new account
  async signup(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return sendError(res, 'An account with this email address already exists.', 409);
      }

      // Hash the password before saving it — the real password is never stored.
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // TODO (next chunk): real email verification via Brevo.
      // For now every new account is marked unverified until that's wired up.
      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role === 'creator' ? 'creator' : 'user',
        isEmailVerified: false
      });

      const accessToken = await issueTokens(res, newUser);

      return sendSuccess(
        res,
        'Account created successfully!',
        { user: formatUserResponse(newUser), accessToken },
        201
      );
    } catch (error) {
      next(error);
    }
  },

  // 2. Login — check email + password, then issue tokens
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return sendError(res, 'Email and password are required.', 400);
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });

      // Important: we return the SAME error whether the email doesn't exist
      // or the password is wrong. This stops an attacker from using the
      // error message to figure out which emails are registered.
      if (!user) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      if (user.isBlocked) {
        return sendError(res, 'This account has been deactivated.', 403);
      }

      // Compare the typed password against the stored hash.
      // bcrypt.compare re-hashes the input and checks it matches —
      // there is no "master password" or shortcut here.
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return sendError(res, 'Invalid email or password.', 401);
      }

      const accessToken = await issueTokens(res, user);

      return sendSuccess(res, 'Logged in successfully!', {
        user: formatUserResponse(user),
        accessToken
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Get the currently logged-in user's own profile
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return sendError(res, 'User session not found.', 404);
      }
      return sendSuccess(res, 'User session active', { user: formatUserResponse(user) });
    } catch (error) {
      next(error);
    }
  },

  // 4. Refresh — swap an old refresh token for a brand-new token pair.
  // This is called automatically by the frontend when the access token expires.
  async refreshToken(req, res, next) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        return sendError(res, 'Refresh token required.', 401);
      }

      const decoded = tokenService.verifyRefreshToken(token);
      if (!decoded) {
        return sendError(res, 'Refresh token has expired or is invalid.', 401);
      }

      // The token must also exist in our database — if it's already been
      // used once and deleted (see below), this check fails and the
      // request is rejected, even if the token signature is still valid.
      const isValidInDb = await tokenService.isRefreshTokenValid(token);
      if (!isValidInDb) {
        return sendError(res, 'Refresh token revoked or reused.', 401);
      }

      const user = await User.findById(decoded.id);
      if (!user || user.isBlocked) {
        return sendError(res, 'User no longer authorized.', 403);
      }

      // Token rotation: delete the token that was just used, then issue
      // a brand-new pair. This means a refresh token can only ever be
      // used once — if a leaked/stolen one gets reused, it will already
      // be gone from the database and this whole request will fail.
      await tokenService.removeRefreshToken(token);
      const newAccessToken = await issueTokens(res, user);

      return sendSuccess(res, 'Token refreshed successfully.', { accessToken: newAccessToken });
    } catch (error) {
      next(error);
    }
  },

  // 5. Logout — end the session on this one device
  async logout(req, res, next) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (token) {
        await tokenService.removeRefreshToken(token);
      }
      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');
      return sendSuccess(res, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  },

  // 6. Logout from all devices — deletes every refresh token for this user
  async logoutAllDevices(req, res, next) {
    try {
      await tokenService.removeAllUserTokens(req.user.id);
      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');
      return sendSuccess(res, 'Logged out from all active devices.');
    } catch (error) {
      next(error);
    }
  },

  // 7. Forgot password — generate a one-time reset token
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Same trick as login: don't reveal whether this email exists.
        return sendSuccess(res, 'If an account exists with this email, a reset code was generated.');
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // valid for 1 hour

      await User.findByIdAndUpdate(user._id, { resetPasswordToken: resetToken, resetPasswordExpire });

      // TODO (next chunk): email this token via Brevo instead of returning it directly.
      return sendSuccess(res, 'Reset instructions prepared.', { resetToken });
    } catch (error) {
      next(error);
    }
  },

  // 8. Reset password using the token from forgotPassword
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({ resetPasswordToken: token });
      if (!user || !user.resetPasswordExpire || new Date(user.resetPasswordExpire) < new Date()) {
        return sendError(res, 'Reset token is invalid or has expired.', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await User.findByIdAndUpdate(user._id, {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpire: null
      });

      // Whenever a password changes, log the user out everywhere else too —
      // if someone else had access to the old password, this cuts them off.
      await tokenService.removeAllUserTokens(user._id);

      return sendSuccess(res, 'Password has been updated. Please log in with your new credentials.');
    } catch (error) {
      next(error);
    }
  },

  // 9. Update the logged-in user's own profile
  async updateProfile(req, res, next) {
    try {
      const { name, bio, avatar, role, location, website, instagram, twitter, cameraGear, badge } = req.body || {};

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (bio !== undefined) updateData.bio = bio.trim();
      if (avatar !== undefined) updateData.avatar = avatar.trim();
      if (role && (role === 'creator' || role === 'user')) updateData.role = role;
      if (location !== undefined) updateData.location = location.trim();
      if (website !== undefined) updateData.website = website.trim();
      if (instagram !== undefined) updateData.instagram = instagram.trim();
      if (twitter !== undefined) updateData.twitter = twitter.trim();
      if (cameraGear !== undefined) updateData.cameraGear = cameraGear.trim();
      if (badge !== undefined) updateData.badge = badge.trim();

      const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData);
      if (!updatedUser) {
        return sendError(res, 'User not found.', 404);
      }

      return sendSuccess(res, 'Profile updated successfully!', { user: formatUserResponse(updatedUser) });
    } catch (error) {
      next(error);
    }
  },

  // 10. Get one creator's public profile + their uploaded images
  async getCreatorProfile(req, res, next) {
    try {
      const { id } = req.params;
      let creator = await User.findById(id);

      if (!creator) {
        const allUsers = await User.find();
        creator = allUsers.find(u =>
          (u._id === id || (u.name && u.name.toLowerCase() === decodeURIComponent(id).toLowerCase())) &&
          !isDummyUser(u)
        );
      }

      if (!creator || isDummyUser(creator)) {
        return sendError(res, 'Creator profile not found.', 404);
      }

      const allImages = await Image.find({ isDeleted: false });
      const creatorId = creator._id;
      const works = allImages.filter(img => img.ownerId === creatorId && !img.isDeleted);

      const totalLikes = works.reduce((sum, img) => sum + (img.likeCount || 0), 0);
      const totalDownloads = works.reduce((sum, img) => sum + (img.downloadCount || 0), 0);
      const totalViews = works.reduce((sum, img) => sum + (img.views || 0), 0);

      return sendSuccess(res, 'Creator details loaded', {
        creator: {
          ...formatUserResponse(creator),
          stats: {
            totalWorks: works.length,
            totalLikes,
            totalDownloads: totalDownloads || creator.totalDownloads || 0,
            views: totalViews || creator.totalViews || 0
          }
        },
        works
      });
    } catch (error) {
      next(error);
    }
  },

  // 11. Get all real creators (used on a "browse creators" page)
  async getCreators(req, res, next) {
    try {
      const users = await User.find();
      const allImages = await Image.find({ isDeleted: false });

      const creators = users.filter(u =>
        !isDummyUser(u) &&
        (u.role === 'creator' || allImages.some(img => img.ownerId === u._id && !img.isDeleted))
      );

      const enrichedCreators = creators.map((c) => {
        const works = allImages.filter(img => img.ownerId === c._id && !img.isDeleted);
        return {
          ...formatUserResponse(c),
          totalUploads: works.length,
          totalLikes: works.reduce((s, w) => s + (w.likeCount || 0), 0),
          totalDownloads: works.reduce((s, w) => s + (w.downloadCount || 0), 0),
          previewWorks: works.slice(0, 3)
        };
      });

      return sendSuccess(res, 'Creators loaded', { creators: enrichedCreators });
    } catch (error) {
      next(error);
    }
  }
};
