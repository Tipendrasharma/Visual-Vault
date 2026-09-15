/**
 * Visual Vault - Rate Limiting Middleware
 *
 * WHY THIS EXISTS (beginner note):
 * Without a limit, someone could write a script that tries thousands of
 * passwords per second against the /login route (a "brute-force attack").
 * This middleware simply counts how many requests come from the same IP
 * address in a time window, and blocks extra requests once the limit
 * is hit.
 */

import rateLimit from 'express-rate-limit';

// Used on login/signup/forgot-password: max 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many attempts from this device. Please try again in 15 minutes.'
  },
  standardHeaders: true, // adds RateLimit-* headers to the response
  legacyHeaders: false
});
