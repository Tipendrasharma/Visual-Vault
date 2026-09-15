/**
 * Visual Vault - JWT and Cookie Configuration
 * Beginner-friendly configuration for JSON Web Tokens and authentication cookies.
 */

export const JWT_CONFIG = {
  // Secret key used to sign Access Tokens (short-lived for security)
  accessSecret: process.env.JWT_SECRET || 'visual_vault_super_secret_jwt_access_key_2026',
  accessExpiresIn: '15m',

  // Secret key used to sign Refresh Tokens (stored in DB and secure HTTP cookie)
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'visual_vault_super_secret_jwt_refresh_key_2026',
  refreshExpiresIn: '7d',

  // Cookie settings for sending tokens securely to the browser
  cookieOptions: {
    httpOnly: true, // Prevents JavaScript from reading the cookie (protects against XSS)
    secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
    sameSite: 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }
};
