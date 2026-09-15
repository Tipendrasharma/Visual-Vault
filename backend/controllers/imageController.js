/**
 * Visual Vault - Image Controller
 * Handles uploading, editing, soft-deleting, and downloading images
 * in a user's personal vault.
 */

import { Image } from '../models/Image.js';
import { Download } from '../models/Download.js';
import { storageService } from '../services/storageService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
// This was missing — downloadImage() below calls getOrCreateImage() but
// without this import the function doesn't exist in this file's scope,
// which made every single download request crash with a ReferenceError.
import { getOrCreateImage } from './socialController.js';

export const imageController = {
  // 1. Upload a new image (either a real file, or a pasted image URL)
  async uploadImage(req, res, next) {
    try {
      const { title, description, tags, category, folderId, customImageUrl } = req.body;

      let uploadedAsset;

      if (req.file) {
        // A real file came through Multer (see uploadMiddleware.js) —
        // hand its buffer to storageService, which uploads it to ImageKit
        // or saves it locally, depending on what's configured.
        uploadedAsset = await storageService.processUpload(req.file, title);
      } else if (customImageUrl) {
        // The user pasted an existing image URL instead of uploading a file
        uploadedAsset = {
          imageUrl: customImageUrl,
          thumbnailUrl: customImageUrl,
          fileType: 'image/jpeg',
          sizeBytes: 0,
          dimensions: { width: 1920, height: 1080 },
          source: 'Visual Vault (Linked Image)'
        };
      } else {
        return sendError(res, 'Please provide an image file or an image URL.', 400);
      }

      // Tags can arrive as an array or as a comma-separated string —
      // normalize to always be an array before saving.
      let parsedTags = [];
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      const newImage = await Image.create({
        title: title || 'Untitled Artwork',
        description: description || '',
        imageUrl: uploadedAsset.imageUrl,
        thumbnailUrl: uploadedAsset.thumbnailUrl,
        tags: parsedTags,
        category: category || 'All Works',
        dimensions: uploadedAsset.dimensions,
        sizeBytes: uploadedAsset.sizeBytes,
        fileType: uploadedAsset.fileType,
        source: uploadedAsset.source,
        ownerId: req.user.id,
        ownerName: req.user.name,
        ownerAvatar: req.user.avatar || null,
        folderId: folderId || null
      });

      return sendSuccess(res, 'Image uploaded to your vault successfully!', newImage, 201);
    } catch (error) {
      next(error);
    }
  },

  // 2. Get the logged-in user's own images (optionally filtered by folder, or trash)
  async getVaultImages(req, res, next) {
    try {
      const { folderId, showTrash } = req.query;

      const query = {
        ownerId: req.user.id,
        isDeleted: showTrash === 'true'
      };
      if (folderId && folderId !== 'all') {
        query.folderId = folderId;
      }

      const images = await Image.find(query);
      return sendSuccess(res, 'Vault assets fetched successfully', images);
    } catch (error) {
      next(error);
    }
  },

  // 3. Get one image's full details (public — anyone can view an image page)
  async getImageById(req, res, next) {
    try {
      const image = await Image.findById(req.params.id);
      if (!image) {
        return sendError(res, 'Image not found.', 404);
      }
      return sendSuccess(res, 'Image details loaded', image);
    } catch (error) {
      next(error);
    }
  },

  // 4. Edit an image's title/description/tags/category/folder
  async updateImage(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, tags, category, folderId } = req.body;

      const image = await Image.findById(id);
      if (!image) {
        return sendError(res, 'Image not found.', 404);
      }

      // Ownership check — only the person who uploaded it can edit it
      if (image.ownerId !== req.user.id) {
        return sendError(res, 'You do not have permission to edit this asset.', 403);
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (folderId !== undefined) updateData.folderId = folderId;
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      const updated = await Image.findByIdAndUpdate(id, updateData);
      return sendSuccess(res, 'Image details updated.', updated);
    } catch (error) {
      next(error);
    }
  },

  // 5. Soft delete — mark as deleted instead of actually removing it,
  // so it can be restored from a "Trash" view later.
  async deleteImage(req, res, next) {
    try {
      const image = await Image.findById(req.params.id);
      if (!image) {
        return sendError(res, 'Image not found.', 404);
      }
      if (image.ownerId !== req.user.id) {
        return sendError(res, 'You do not have permission to delete this asset.', 403);
      }

      await Image.findByIdAndUpdate(req.params.id, { isDeleted: true });
      return sendSuccess(res, 'Image moved to Vault Trash.');
    } catch (error) {
      next(error);
    }
  },

  // 6. Undo a soft delete
  async restoreImage(req, res, next) {
    try {
      const image = await Image.findById(req.params.id);
      if (!image) {
        return sendError(res, 'Image not found.', 404);
      }
      if (image.ownerId !== req.user.id) {
        return sendError(res, 'Unauthorized action.', 403);
      }

      await Image.findByIdAndUpdate(req.params.id, { isDeleted: false });
      return sendSuccess(res, 'Image restored back to Vault.');
    } catch (error) {
      next(error);
    }
  },

  // 7. Record that a download happened (increments the counter + logs history)
  async downloadImage(req, res, next) {
    try {

      const { image } = req.body;

      const imageId = await getOrCreateImage(image, req.user);

      const dbImage = await Image.findById(imageId);

      if (dbImage) {
        await Image.findByIdAndUpdate(imageId, {
          downloadCount: (dbImage.downloadCount || 0) + 1
        });
      }

      if (req.user) {
        await Download.create({
          userId: req.user.id,
          imageId
        });
      }

      return sendSuccess(res, "Download registered.", {
        downloadUrl: dbImage?.imageUrl
      });

    } catch (error) {
      next(error);
    }
  },
  // 8. Stream the actual image file back with a "download" header, so the
  // browser saves it to disk instead of just displaying it.
  async proxyDownloadFile(req, res, next) {
    try {
      const { url, filename, id } = req.query;
      if (!url) {
        return res.status(400).send('Image URL is required.');
      }

      if (id) {
        try {
          const image = await Image.findById(id);
          if (image) {
            await Image.findByIdAndUpdate(id, { downloadCount: (image.downloadCount || 0) + 1 });
          }
          if (req.user) {
            await Download.create({ userId: req.user.id, imageId: id });
          }
        } catch (trackErr) {
          console.warn('[Download Tracker] Stat warning:', trackErr.message);
        }
      }

      const rawName = (filename || 'visual_vault_asset').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
      const safeFilename = /\.(jpg|png|webp)$/i.test(rawName) ? rawName : `${rawName}.jpg`;

      const upstreamRes = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!upstreamRes.ok) {
        return res.status(upstreamRes.status).send('Failed to fetch source image for download.');
      }

      res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

      const buffer = Buffer.from(await upstreamRes.arrayBuffer());
      return res.send(buffer);
    } catch (error) {
      console.error('[Download Proxy Error]:', error.message);
      if (!res.headersSent) {
        res.status(500).send('Failed to stream image download.');
      }
    }
  }
};