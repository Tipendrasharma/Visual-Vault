/**
 * Visual Vault - Image Card Component
 * Shows one image in a grid, with hover buttons for like/save/download.
 * If an image URL is broken, the card hides itself instead of showing
 * a broken-image icon.
 */

import React, { useState } from 'react';
import { Heart, Bookmark, Download } from 'lucide-react';
import { useSocial } from '../context/SocialContext.jsx';

export default function ImageCard({ image, onClick, onError: onImageError }) {
  const { isLiked, isSaved, toggleLike, toggleBookmark, triggerDownload } = useSocial();

  // Local state, specific to just this one card — doesn't need to be
  // in Context because no other component needs to know about it.
  const [imgSrc, setImgSrc] = useState(image.thumbnailUrl || image.imageUrl);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);

  const imgId = image.id || image._id;
  const liked = isLiked(imgId);
  const saved = isSaved(imgId);

  // If the thumbnail fails to load, try the full-size image once as a
  // fallback. If that also fails, give up and hide the card entirely.
  const handleImgError = () => {
    if (!hasRetried && image.imageUrl && imgSrc !== image.imageUrl) {
      setHasRetried(true);
      setImgSrc(image.imageUrl);
    } else {
      setHasError(true);
      if (onImageError) onImageError(imgId);
    }
  };

  if (hasError) {
    return null;
  }

  // e.stopPropagation() stops the click from also triggering the
  // card's own onClick (which opens the full image detail view) —
  // without it, clicking "Like" would also open the modal.
  const handleLike = (e) => {
    e.stopPropagation();
    toggleLike(image);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    toggleBookmark(image);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    triggerDownload(image);
  };

  // Images from Pixabay/Pexels don't have a "creator" in our own
  // database, so we show "Visual Vault" as the attribution instead
  // of trying to display a fake profile for them.
  const isExternalApi =
    image.provider === 'Pixabay' ||
    image.provider === 'Pexels' ||
    (typeof imgId === 'string' && (imgId.startsWith('pixabay_') || imgId.startsWith('pexels_')));

  const isRealCreator = !isExternalApi && Boolean(
    (image.ownerId || image.userId) &&
    (image.ownerName || (image.isVaultAsset && image.author && image.author !== 'Visual Vault' && image.author !== 'Visual Vault Archive'))
  );

  const authorName = isRealCreator ? (image.ownerName || image.author) : 'Visual Vault';
  const authorSubtitle = isRealCreator ? 'Available for hire' : 'Visual Vault';
  const authorAvatar = isRealCreator ? (image.ownerAvatar || image.authorAvatar) : null;

  return (
    <div
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-none sm:rounded-sm bg-neutral-100 cursor-pointer select-none transition-shadow duration-300 hover:shadow-lg"
    >
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="w-full aspect-[4/3] bg-neutral-200/80 animate-pulse" />
      )}

      {/* Pure Photographic Image */}
      <img
        src={imgSrc}
        alt={image.title || 'Visual asset'}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={handleImgError}
        className={`w-full h-auto object-cover block transition-all duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
      />

      {/* Unsplash-style Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-between p-3 sm:p-4 pointer-events-none">
        {/* Top Actions: Bookmark & Like buttons */}
        <div className="flex items-center justify-end gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleBookmark}
            className={`p-2 rounded-lg backdrop-blur-md shadow-sm transition-all duration-200 active:scale-90 cursor-pointer ${
              saved
                ? 'bg-neutral-900 text-white'
                : 'bg-white/90 hover:bg-white text-neutral-800'
            }`}
            title={saved ? 'Saved to Vault' : 'Save to Vault'}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current text-white' : 'text-neutral-800'}`} />
          </button>

          <button
            type="button"
            onClick={handleLike}
            className={`p-2 rounded-lg backdrop-blur-md shadow-sm transition-all duration-200 active:scale-90 cursor-pointer ${
              liked
                ? 'bg-red-500 text-white shadow-red-500/30'
                : 'bg-white/90 hover:bg-white text-neutral-800 hover:text-red-500'
            }`}
            title={liked ? 'Liked' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Actions: Photographer info & Download button */}
        <div className="flex items-center justify-between pointer-events-auto pt-2">
          {/* Creator Profile or Visual Vault Brand */}
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {isRealCreator && authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/40 shadow-sm flex-shrink-0"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(authorName)}`;
                }}
              />
            ) : isRealCreator ? (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 border border-white/40 shadow-sm flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                {(authorName || 'C')[0]?.toUpperCase()}
              </div>
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/90 border border-white/40 shadow-sm flex items-center justify-center flex-shrink-0 text-white font-black text-xs tracking-tighter">
                V
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-xs sm:text-sm font-semibold truncate leading-tight drop-shadow-sm">
                {authorName}
              </p>
              <p className="text-white/80 text-[10px] sm:text-[11px] leading-tight flex items-center gap-1 drop-shadow-sm truncate mt-0.5">
                <span>{authorSubtitle}</span>
                {isRealCreator && (
                  <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-white/30 text-[9px] font-bold text-white">✓</span>
                )}
              </p>
            </div>
          </div>

          {/* Download Button (Matching Unsplash white icon button) */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 sm:p-2.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center flex-shrink-0 cursor-pointer"
            title="Download photo"
          >
            <Download className="w-4 h-4 text-neutral-900" />
          </button>
        </div>
      </div>
    </div>
  );
}
