/**
 * Visual Vault - Role Based Access Control (RBAC) Middleware
 * Restricts creator or specific endpoints to authorized user roles ('user', 'creator').
 */

import { sendError } from '../utils/responseHandler.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before verifying access permissions.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of the following privileges: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};
