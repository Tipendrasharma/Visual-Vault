/**
 * Visual Vault - Social Controller
 * Handles likes, comments, replies, saved/bookmarked images,
 * download history, and "recently viewed" tracking.
 */

import { Like } from '../models/Like.js';
import { Comment } from '../models/Comment.js';
import { Bookmark } from '../models/Bookmark.js';
import { Download } from '../models/Download.js';
import { Image } from '../models/Image.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

// A simple in-memory map for "recently viewed" images per user.
// Note for beginners: this resets every time the server restarts,
// and would need to move into MongoDB (or Redis) if this app ever
// ran on more than one server at a time. For a single-server project
// like this, keeping it in memory is fine and much simpler.
const recentlyViewedCache = new Map();

// Exported (not just a local helper anymore) so imageController.js can
// import and reuse this exact same "find or upsert" logic for downloads —
// without this export, imageController.js has no way to reach this
// function, which was causing every download request to crash with
// "getOrCreateImage is not defined".
export async function getOrCreateImage(image, user) {

  if (!image) {
    throw new Error("Image data is required");
  }

  // Agar upload image hai
  if (image._id) {
    return image._id;
  }

  // Pexels/Pixabay image already database me hai?
  let dbImage = await Image.findById(image.id);

  if (!dbImage) {

    try {

      dbImage = await Image.create({
        _id: String(image.id),
        title: image.title || "Untitled",
        description: image.description || "",
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl || image.imageUrl,
        tags: image.tags || [],
        category: image.category || "All Works",
        source: image.provider || "Pexels",
        dimensions: image.dimensions,
        ownerId: "external",
        ownerName: image.author || "Pexels",
        ownerAvatar: null
      });

    } catch (err) {

      // Agar kisi aur request ne isi image ko pehle hi insert kar diya
      // to duplicate key (E11000) aa sakta hai.
      if (err.code === 11000) {
        dbImage = await Image.findById(image.id);
      } else {
        throw err;
      }

    }

  }

  return dbImage._id;
}

export const socialController = {
  // 1. Like / Unlike an image — a classic "toggle": if a like already
  // exists, remove it; otherwise, create one. This one endpoint handles
  // both actions instead of needing separate /like and /unlike routes.
  async toggleLike(req, res, next) {
    try {
      const { image } = req.body;
      const imageId = await getOrCreateImage(image, req.user);

      const userId = req.user.id;

      const existingLike = await Like.findOne({
        userId,
        imageId
      });

      const dbImage = await Image.findById(imageId);

      if (existingLike) {
        await Like.deleteOne({ userId, imageId });

        if (dbImage) {
          await Image.findByIdAndUpdate(imageId, {
            likeCount: Math.max(0, (dbImage.likeCount || 1) - 1)
          });
        }

        return sendSuccess(res, "Unliked image", {
          isLiked: false
        });
      }

      await Like.create({
        userId,
        imageId
      });

      if (dbImage) {
        await Image.findByIdAndUpdate(imageId, {
          likeCount: (dbImage.likeCount || 0) + 1
        });
      }

      return sendSuccess(res, "Liked image", {
        isLiked: true
      });

    } catch (err) {
      next(err);
    }
  },

  // 2. Get every image the logged-in user has liked
  async getUserLikes(req, res, next) {
    try {
      const userLikes = await Like.find({ userId: req.user.id });
      const imageIds = userLikes.map(l => l.imageId);

      const allImages = await Image.find({ isDeleted: false });
      const likedImages = allImages.filter(img => imageIds.includes(img._id));

      return sendSuccess(res, 'User liked images loaded', { likedImageIds: imageIds, images: likedImages });
    } catch (error) {
      next(error);
    }
  },

  // 3. Get all top-level comments (with their replies) on one image
  async getComments(req, res, next) {
    try {
      const comments = await Comment.find({ imageId: req.params.imageId });
      return sendSuccess(res, 'Comments retrieved', comments);
    } catch (error) {
      next(error);
    }
  },

  // 4. Post a new top-level comment
  async addComment(req, res, next) {
    try {
      const { imageId, content } = req.body;
      if (!content || !content.trim()) {
        return sendError(res, 'Comment content cannot be empty.', 400);
      }

      const newComment = await Comment.create({
        imageId,
        userId: req.user.id,
        userName: req.user.name,
        userAvatar: req.user.avatar,
        content: content.trim()
      });

      const image = await Image.findById(imageId);
      if (image) {
        await Image.findByIdAndUpdate(imageId, { commentCount: (image.commentCount || 0) + 1 });
      }

      return sendSuccess(res, 'Comment posted!', newComment, 201);
    } catch (error) {
      next(error);
    }
  },

  // 5. Reply to an existing comment (one level of nesting — a reply
  // can't itself be replied to, which keeps threads easy to follow)
  async addReply(req, res, next) {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return sendError(res, 'Reply content cannot be empty.', 400);
      }

      const updatedComment = await Comment.addReply(req.params.commentId, {
        userId: req.user.id,
        userName: req.user.name,
        userAvatar: req.user.avatar,
        content: content.trim()
      });

      if (!updatedComment) {
        return sendError(res, 'Comment not found to reply to.', 404);
      }

      return sendSuccess(res, 'Reply added!', updatedComment);
    } catch (error) {
      next(error);
    }
  },

  // 6. Delete a comment — only the person who wrote it can delete it
  async deleteComment(req, res, next) {
    try {
      const comment = await Comment.findById(req.params.id);
      if (!comment) {
        return sendError(res, 'Comment not found.', 404);
      }
      if (comment.userId !== req.user.id) {
        return sendError(res, 'Unauthorized to delete this comment.', 403);
      }

      await Comment.deleteById(req.params.id);

      const image = await Image.findById(comment.imageId);
      if (image) {
        await Image.findByIdAndUpdate(comment.imageId, { commentCount: Math.max(0, (image.commentCount || 1) - 1) });
      }

      return sendSuccess(res, 'Comment deleted.');
    } catch (error) {
      next(error);
    }
  },

  // 7. Save / Unsave (bookmark) an image — same toggle pattern as likes
  async toggleBookmark(req, res, next) {
    try {
      const { image } = req.body;

      const imageId = await getOrCreateImage(image, req.user);

      const userId = req.user.id;

      const existingBookmark = await Bookmark.findOne({ userId, imageId });
      if (existingBookmark) {
        await Bookmark.deleteOne({ userId, imageId });
        return sendSuccess(res, 'Removed from saved collection', { isSaved: false });
      }

      await Bookmark.create({ userId, imageId });
      return sendSuccess(res, 'Saved to collection', { isSaved: true });
    } catch (error) {
      next(error);
    }
  },

  // 8. Get all images the user has saved
  async getUserBookmarks(req, res, next) {
    try {
      const bookmarks = await Bookmark.find({ userId: req.user.id });
      const imageIds = bookmarks.map(b => b.imageId);

      const allImages = await Image.find({ isDeleted: false });
      const savedImages = allImages.filter(img => imageIds.includes(img._id));

      return sendSuccess(res, 'Bookmarked images loaded', { savedImageIds: imageIds, images: savedImages });
    } catch (error) {
      next(error);
    }
  },

  // 9. Get the user's download history
  async getDownloadHistory(req, res, next) {
    try {
      const downloads = await Download.find({ userId: req.user.id });
      const allImages = await Image.find({ isDeleted: false });

      const downloadedImages = downloads
        .map(d => ({ downloadId: d._id, downloadedAt: d.createdAt, image: allImages.find(i => i._id === d.imageId) || null }))
        .filter(item => item.image !== null);

      return sendSuccess(res, 'Download history loaded', downloadedImages);
    } catch (error) {
      next(error);
    }
  },

  // NOTE: this duplicates imageController.downloadImage below and isn't
  // wired to any route in socialRoutes.js right now — the app actually
  // downloads through POST /images/:id/download (imageController.downloadImage).
  // Leaving it here in case you intended to switch routing to it, but it's
  // dead code today; you can safely delete it if you don't plan to use it.
  async recordDownload(req, res, next) {
    try {
      const { image } = req.body;

      const imageId = await getOrCreateImage(image, req.user);

      await Download.create({
        userId: req.user.id,
        imageId
      });

      await Image.findByIdAndUpdate(imageId, {
        $inc: { downloadCount: 1 }
      });

      return sendSuccess(res, "Download recorded");
    } catch (err) {
      next(err);
    }
  },

  // 10. Track and fetch "recently viewed" images (see cache note above)
  async addRecentlyViewed(req, res, next) {
    try {
      const { imageId } = req.body;
      const userId = req.user ? req.user.id : 'guest_session';

      let list = recentlyViewedCache.get(userId) || [];
      list = list.filter(id => id !== imageId); // remove old position if it's already there
      list.unshift(imageId); // add to the front (most recent first)
      if (list.length > 20) list.pop(); // only keep the last 20

      recentlyViewedCache.set(userId, list);
      return sendSuccess(res, 'Recorded recently viewed');
    } catch (error) {
      next(error);
    }
  },

  async getRecentlyViewed(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'guest_session';
      const list = recentlyViewedCache.get(userId) || [];

      const allImages = await Image.find({ isDeleted: false });
      const viewedImages = list.map(id => allImages.find(img => img._id === id)).filter(Boolean);

      return sendSuccess(res, 'Recently viewed images loaded', viewedImages);
    } catch (error) {
      next(error);
    }
  }
};