/**
 * Visual Vault - Folder Validators
 */

export const validateFolderCreate = (data = {}) => {
  const errors = {};
  const { name } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Folder name must be at least 2 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
