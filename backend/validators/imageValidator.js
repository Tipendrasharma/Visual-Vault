/**
 * Visual Vault - Image Validators
 */

export const validateImageUpload = (data = {}) => {
  const errors = {};
  const { title } = data;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.title = 'Image title must be at least 2 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateImageUpdate = (data = {}) => {
  const errors = {};
  const { title } = data;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    errors.title = 'Title must be at least 2 characters if provided.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
