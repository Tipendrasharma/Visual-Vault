/**
 * Visual Vault - Auth Routes
 */

import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { authLimiter } from '../middlewares/rateLimitMiddleware.js';
import {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../validators/authValidator.js';

const router = Router();

// Public auth endpoints — rate-limited so an attacker can't brute-force
// passwords or spam signups from one IP address
router.post('/signup', authLimiter, validateRequest(validateSignup), authController.signup);
router.post('/login', authLimiter, validateRequest(validateLogin), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, validateRequest(validateForgotPassword), authController.forgotPassword);
router.post('/reset-password', validateRequest(validateResetPassword), authController.resetPassword);

// Public creator endpoints
router.get('/creators', authController.getCreators);
router.get('/creators/:id', authController.getCreatorProfile);
router.get('/creator/:id', authController.getCreatorProfile);

// Protected auth endpoints
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/logout-all', authMiddleware, authController.logoutAllDevices);

export default router;
