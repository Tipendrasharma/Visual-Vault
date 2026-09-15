/**
 * Visual Vault - Comment Model
 * Handles image comments and nested replies.
 */

import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'reply_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
    userId: { type: String, required: true },
    userName: { type: String, default: 'Vault Member' },
    userAvatar: { type: String, default: '' },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) },
    imageId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, default: 'Vault Member' },
    userAvatar: { type: String, default: '' },
    content: { type: String, required: true },
    replies: [replySchema]
  },
  { timestamps: true }
);

export const CommentModel = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export const Comment = {
  find: (query = {}) => CommentModel.find(query).sort({ createdAt: -1 }),
  findById: (id) => CommentModel.findById(id),
  create: (data) => CommentModel.create(data),
  async addReply(commentId, replyData) {
    const comment = await CommentModel.findById(commentId);
    if (!comment) return null;
    comment.replies.push(replyData);
    await comment.save();
    return comment;
  },
  deleteById: (id) => CommentModel.findByIdAndDelete(id),
  countDocuments: (query = {}) => CommentModel.countDocuments(query)
};
