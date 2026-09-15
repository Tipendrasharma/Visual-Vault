/**
 * Visual Vault - Validation Middleware
 * Executes custom validator schemas and halts invalid requests before reaching controllers.
 */

import { sendError } from '../utils/responseHandler.js';

export const validateRequest = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req.body);
    if (!isValid) {
      return sendError(res, 'Validation failed. Please check submitted fields.', 422, errors);
    }
    next();
  };
};
