/**
 * Visual Vault - Authentication Middleware
 *
 * This runs BEFORE any "protected" route handler. Its job: read the
 * access token from the request, check it's valid, and — if it is —
 * attach the logged-in user's info to `req.user` so the rest of the
 * route can use it (e.g. "who is uploading this image?").
 */

import { tokenService } from '../services/tokenService.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/responseHandler.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // The token can arrive three ways: as a Bearer header (common for
    // API clients), as a cookie (what our own frontend uses), or as a
    // query string (needed for direct file-download links, which can't
    // send custom headers).
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return sendError(res, 'Authentication token required. Please log in.', 401);
    }

    const decoded = tokenService.verifyAccessToken(token);
    if (!decoded) {
      return sendError(res, 'Invalid or expired access token. Please refresh your session.', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User associated with this token no longer exists.', 401);
    }

    if (user.isBlocked) {
      return sendError(res, 'Your account has been suspended.', 403);
    }

    // Everything after this point in the request can now read req.user
    req.user = {
      id: user._id,
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified
    };

    next();
  } catch (error) {
    return sendError(res, 'Authentication verification failed.', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) — only lets 'creator' or 'admin'
 * users through. Must run AFTER authMiddleware (it needs req.user).
 * Example use: uploading is a creator-only action.
 */
export const requireCreator = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }
  if (req.user.role !== 'creator' && req.user.role !== 'admin') {
    return sendError(res, 'Only creator accounts can upload assets. Please upgrade to a Creator account.', 403);
  }
  next();
};

/**
 * Optional Auth — for routes that behave differently for logged-in
 * users but should still work for guests (e.g. browsing images).
 * Unlike authMiddleware, this never blocks the request.
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = tokenService.verifyAccessToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user && !user.isBlocked) {
          req.user = { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar };
        }
      }
    }
  } catch (error) {
    // Any problem here just means "treat as guest" — never block the request
  }
  next();
};
