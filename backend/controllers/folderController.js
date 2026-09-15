/**
 * Visual Vault - Folder Controller
 * Lets users organize their uploaded images into folders (like
 * "College Projects" or "Wallpapers") — create, rename, delete, and
 * move images between them.
 */

import { Folder } from '../models/Folder.js';
import { Image } from '../models/Image.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const folderController = {
  // 1. Get all of the logged-in user's folders, with an image count on each
  async getFolders(req, res, next) {
    try {
      const folders = await Folder.find({ userId: req.user.id });
      const userImages = await Image.find({ ownerId: req.user.id, isDeleted: false });

      const foldersWithCounts = folders.map(f => ({
        ...(f.toObject ? f.toObject() : f),
        assetCount: userImages.filter(img => img.folderId === f._id).length
      }));

      return sendSuccess(res, 'User folders retrieved', foldersWithCounts);
    } catch (error) {
      next(error);
    }
  },

  // 2. Create a new folder
  async createFolder(req, res, next) {
    try {
      const { name, coverImage } = req.body;
      const newFolder = await Folder.create({
        name: name.trim(),
        coverImage: coverImage || undefined, // schema default kicks in if not provided
        userId: req.user.id
      });
      return sendSuccess(res, 'Folder created successfully!', newFolder, 201);
    } catch (error) {
      next(error);
    }
  },

  // 3. Rename a folder or change its cover image
  async updateFolder(req, res, next) {
    try {
      const { id } = req.params;
      const { name, coverImage } = req.body;

      const folder = await Folder.findById(id);
      if (!folder) {
        return sendError(res, 'Folder not found.', 404);
      }
      // Ownership check — you can only edit your own folders
      if (folder.userId !== req.user.id) {
        return sendError(res, 'Unauthorized action.', 403);
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (coverImage) updateData.coverImage = coverImage;

      const updated = await Folder.findByIdAndUpdate(id, updateData);
      return sendSuccess(res, 'Folder updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  },

  // 4. Delete a folder — images inside it are NOT deleted, they just
  // move back to the root of the vault (folderId set to null)
  async deleteFolder(req, res, next) {
    try {
      const { id } = req.params;
      const folder = await Folder.findById(id);
      if (!folder) {
        return sendError(res, 'Folder not found.', 404);
      }
      if (folder.userId !== req.user.id) {
        return sendError(res, 'Unauthorized action.', 403);
      }

      const imagesInFolder = await Image.find({ folderId: id });
      for (const img of imagesInFolder) {
        await Image.findByIdAndUpdate(img._id, { folderId: null });
      }

      await Folder.deleteById(id);
      return sendSuccess(res, 'Folder deleted. Images have been moved to root vault.');
    } catch (error) {
      next(error);
    }
  },

  // 5. Move an image into a folder (or back to root vault if folderId is empty)
  async moveImage(req, res, next) {
    try {
      const { imageId, folderId } = req.body;

      const image = await Image.findById(imageId);
      if (!image) {
        return sendError(res, 'Image not found.', 404);
      }
      if (image.ownerId !== req.user.id) {
        return sendError(res, 'Unauthorized to move this image.', 403);
      }

      if (folderId) {
        const folder = await Folder.findById(folderId);
        if (!folder || folder.userId !== req.user.id) {
          return sendError(res, 'Destination folder not found.', 404);
        }
      }

      const updated = await Image.findByIdAndUpdate(imageId, { folderId: folderId || null });
      return sendSuccess(res, 'Image moved successfully.', updated);
    } catch (error) {
      next(error);
    }
  }
};
