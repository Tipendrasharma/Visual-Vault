/**
 * Visual Vault - Auth Validators
 * Validates signup, login, and password management input payloads.
 */

export const validateSignup = (data = {}) => {
  const errors = {};
  const { name, email, password } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters long.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLogin = (data = {}) => {
  const errors = {};
  const { email, password } = data;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email address is required.';
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errors.password = 'Password is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateForgotPassword = (data = {}) => {
  const errors = {};
  const { email } = data;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid registered email address.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateResetPassword = (data = {}) => {
  const errors = {};
  const { token, newPassword } = data;

  if (!token) {
    errors.token = 'Reset password token is required.';
  }

  if (!newPassword || newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
