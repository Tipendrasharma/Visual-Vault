/**
 * Visual Vault - Image Detail Modal
 * The full-screen view when you click an image: large preview,
 * metadata, like/save/share/download buttons, and a comment thread.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Heart, Bookmark, Download, Share2, Tag, Calendar, 
  Maximize2, HardDrive, User, Layers, MessageSquare, CornerDownRight, Check, ExternalLink
} from 'lucide-react';
import { useSocial } from '../context/SocialContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatBytes, formatDate, getImageQuality } from '../utils/formatters.js';

export default function ImageDetailModal({ image, onClose, onTagClick }) {
  const { isLiked, isSaved, toggleLike, toggleBookmark, triggerDownload, recordView } = useSocial();
  const { user, openAuthModal } = useAuth();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [modalSrc, setModalSrc] = useState(image?.imageUrl || image?.thumbnailUrl);

  const imgId = image?.id || image?._id;
  const liked = isLiked(imgId);
  const saved = isSaved(imgId);
  const quality = getImageQuality(image?.dimensions);

  // Images from Pixabay/Pexels aren't uploaded by one of our own
  // users, so we show "Visual Vault" as the attribution instead of a
  // fake creator profile for them.
  const isExternalApi = 
    image?.provider === 'Pixabay' || 
    image?.provider === 'Pexels' || 
    (typeof imgId === 'string' && (imgId.startsWith('pixabay_') || imgId.startsWith('pexels_')));

  const isRealCreator = !isExternalApi && Boolean(
    (image?.ownerId || image?.userId) && 
    (image?.ownerName || (image?.isVaultAsset && image?.author && image?.author !== 'Visual Vault' && image?.author !== 'Visual Vault Archive'))
  );

  // Runs whenever a different image is opened (image/imgId changes):
  // record it as "recently viewed" and load its comment thread.
  useEffect(() => {
    if (!image) return;

    recordView(imgId);

    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const res = await api.social.getComments(imgId);
        if (res.success) {
          setComments(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [image, imgId]);

  if (!image) return null;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login', 'user', 'Please log in to leave comments and feedback.');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await api.social.addComment(imgId, newComment.trim());
      if (res.success && res.data) {
        setComments(prev => [res.data, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  const handleAddReply = async (commentId) => {
    if (!user) {
      openAuthModal('login', 'user', 'Please log in to reply to comments.');
      return;
    }
    if (!replyContent.trim()) return;

    try {
      const res = await api.social.addReply(commentId, replyContent.trim());
      if (res.success && res.data) {
        setComments(prev => prev.map(c => (c._id === commentId ? res.data : c)));
        setReplyingToId(null);
        setReplyContent('');
      }
    } catch (err) {
      alert(err.message || 'Failed to submit reply');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `?image=${imgId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black text-white backdrop-blur-sm transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: High-Res Image Canvas */}
        <div className="flex-1 bg-neutral-950 flex items-center justify-center relative p-4 overflow-hidden min-h-[320px] md:min-h-[560px]">
          <img
            src={modalSrc}
            alt={image.title}
            referrerPolicy="no-referrer"
            onError={() => {
              if (modalSrc !== image.thumbnailUrl && image.thumbnailUrl) {
                setModalSrc(image.thumbnailUrl);
              }
            }}
            className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg shadow-xl"
          />

          {/* Quick Floating Actions */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-neutral-300 pointer-events-none">
            <span className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full font-semibold text-white flex items-center gap-1.5 shadow-md">
              <span className={`w-2 h-2 rounded-full ${quality.tier === '4k' ? 'bg-amber-400' : quality.tier === '2k' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
              {quality.label} ({quality.short})
            </span>
            <span className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full font-mono shadow-md">
              {image.dimensions?.width} × {image.dimensions?.height} px
            </span>
          </div>
        </div>

        {/* Right: Detailed Metadata & Social Interaction Panel */}
        <div className="w-full md:w-[420px] bg-white flex flex-col justify-between overflow-y-auto border-l border-neutral-200">
          
          <div className="p-6 space-y-6">
            
            {/* Header: Title & Author */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
                  {image.category || 'Curated Photo'}
                </span>
                <span className="text-xs text-neutral-400">
                  {formatDate(image.createdAt || new Date())}
                </span>
              </div>

              <h2 className="text-xl font-bold text-neutral-900 leading-tight">
                {image.title}
              </h2>

              <p className="text-sm text-neutral-600 mt-1">
                {image.description || 'Master RAW photograph curated from unified stock engines.'}
              </p>

              {isRealCreator ? (
                <Link
                  to={`/creator/${image.ownerId || image.userId}`}
                  onClick={onClose}
                  className="group/creator flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 hover:bg-neutral-50 p-1.5 rounded-xl transition-colors"
                  title="View full creator profile & equipment"
                >
                  <div className="flex items-center gap-2.5">
                    {image.ownerAvatar || image.authorAvatar ? (
                      <img
                        src={image.ownerAvatar || image.authorAvatar}
                        alt={image.ownerName || image.author}
                        className="w-9 h-9 rounded-full object-cover border border-neutral-200 shadow-xs"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(image.ownerName || image.author || 'creator')}`;
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {(image.ownerName || image.author || 'C')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-neutral-900 group-hover/creator:text-black">
                          {image.ownerName || image.author || 'Verified Creator'}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded-md font-semibold">Creator</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">Verified Creator Profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 group-hover/creator:text-black pr-1">
                    <span>Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </Link>
              ) : (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 p-1.5 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-black text-xs shadow-xs tracking-tighter">
                      V
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">
                        Visual Vault
                      </p>
                      <p className="text-[11px] text-neutral-500">Visual Vault</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Like, Save, Share, Download */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <button
                onClick={() => toggleLike(imgId)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  liked
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <Heart className={`w-4 h-4 mb-1 ${liked ? 'fill-current' : ''}`} />
                <span>{liked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={() => toggleBookmark(imgId)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  saved
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 mb-1 ${saved ? 'fill-current' : ''}`} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 mb-1 text-emerald-600" /> : <Share2 className="w-4 h-4 mb-1" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={() => triggerDownload(image)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 mb-1" />
                <span>Download</span>
              </button>
            </div>

            {/* Technical Specifications */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Quality Grade</span>
                <span className="font-semibold text-neutral-900">{quality.label} ({quality.short})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Resolution</span>
                <span className="font-mono text-neutral-900">{image.dimensions?.width} × {image.dimensions?.height}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">File Size</span>
                <span className="font-mono text-neutral-900">{formatBytes(image.sizeBytes || 3500000)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Total Downloads</span>
                <span className="font-semibold text-neutral-900">{image.downloadCount || 0} times</span>
              </div>
            </div>

            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <div>
                <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-neutral-400" />
                  Semantic Visual Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {image.tags.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => onTagClick && onTagClick(tag)}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-medium transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Social Comments & Discussion Thread */}
            <div className="pt-2 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                  Discussion ({comments.length})
                </h3>
              </div>

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={user ? 'Add a public critique or note...' : 'Log in to join the discussion...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onClick={() => {
                      if (!user) openAuthModal('login', 'user', 'Please log in to join the discussion and comment.');
                    }}
                    readOnly={!user}
                    className="flex-1 px-3 py-1.5 text-xs bg-neutral-100 rounded-xl border border-transparent focus:border-neutral-300 focus:bg-white focus:outline-none cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={user && !newComment.trim()}
                    className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {user ? 'Post' : 'Log in'}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No comments yet. Be the first to share thoughts!</p>
                ) : (
                  comments.map(c => (
                    <div key={c._id} className="text-xs space-y-1.5 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900">{c.userName}</span>
                        <span className="text-[10px] text-neutral-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-neutral-700">{c.content}</p>

                      {/* Reply button */}
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (!user) {
                              openAuthModal('login', 'user', 'Please log in to reply to comments.');
                              return;
                            }
                            setReplyingToId(replyingToId === c._id ? null : c._id);
                          }}
                          className="text-[11px] font-semibold text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          Reply
                        </button>
                      </div>

                      {/* Active Reply Input Box */}
                      {replyingToId === c._id && (
                        <div className="pt-2 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs bg-white rounded-lg border border-neutral-300 focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddReply(c._id)}
                            className="px-2.5 py-1 bg-black text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-neutral-800"
                          >
                            Send
                          </button>
                        </div>
                      )}

                      {/* Nested Replies List */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="pl-3 border-l-2 border-neutral-200 mt-2 space-y-1.5">
                          {c.replies.map(r => (
                            <div key={r._id} className="text-[11px]">
                              <span className="font-semibold text-neutral-900">{r.userName}: </span>
                              <span className="text-neutral-600">{r.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
