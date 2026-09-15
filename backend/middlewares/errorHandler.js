/**
 * Visual Vault - Central Error Handler Middleware
 * Catches all unexpected application errors and formats a clean beginner-friendly JSON response.
 */

import { sendError } from '../utils/responseHandler.js';

export const errorHandler = (err, req, res, next) => {
  console.error(' Visual Vault Server Error:', err.message || err);

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File size exceeds maximum limit of 10MB.', 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  }

  // Handle Mongoose / DB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `A record with this ${field} already exists.`, 409);
  }

  // Handle generic JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid security token provided.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Security token has expired.', 401);
  }

  // Default internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  return sendError(res, message, statusCode);
};
