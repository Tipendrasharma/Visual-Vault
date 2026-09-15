/**
 * Visual Vault - Formatters Utility
 */

export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

/**
 * Determines visual resolution quality tier in order:
 * 4K UHD -> 2K QHD -> Full HD (1080p) -> HD (720p) -> SD (<720p)
 */
export const getImageQuality = (dimensions) => {
  const width = Number(dimensions?.width) || 0;
  const height = Number(dimensions?.height) || 0;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);
  const totalPixels = width * height;

  // 4K Ultra HD: 3840x2160 or >= 8.29M pixels
  if (maxDim >= 3840 || minDim >= 2160 || totalPixels >= 3840 * 2160) {
    return {
      tier: '4k',
      badge: '4K UHD',
      short: '4K',
      label: '4K Ultra HD',
      badgeClass: 'bg-amber-500/95 text-white border border-amber-300/40 shadow-sm'
    };
  }

  // 2K Quad HD: 2560x1440 or >= 3.68M pixels
  if (maxDim >= 2560 || minDim >= 1440 || totalPixels >= 2560 * 1440) {
    return {
      tier: '2k',
      badge: '2K QHD',
      short: '2K',
      label: '2K Quad HD',
      badgeClass: 'bg-emerald-600/95 text-white border border-emerald-300/40 shadow-sm'
    };
  }

  // Full HD: 1920x1080
  if (maxDim >= 1920 || minDim >= 1080 || totalPixels >= 1920 * 1080) {
    return {
      tier: 'fhd',
      badge: 'Full HD',
      short: '1080p',
      label: 'Full HD 1080p',
      badgeClass: 'bg-blue-600/95 text-white border border-blue-300/40 shadow-sm'
    };
  }

  // HD: 1280x720
  if (maxDim >= 1280 || minDim >= 720 || totalPixels >= 1280 * 720) {
    return {
      tier: 'hd',
      badge: 'HD',
      short: '720p',
      label: 'HD 720p',
      badgeClass: 'bg-cyan-600/95 text-white border border-cyan-300/40 shadow-sm'
    };
  }

  // Below 720p: SD
  return {
    tier: 'sd',
    badge: 'SD',
    short: 'SD',
    label: 'Standard Definition',
    badgeClass: 'bg-neutral-700/95 text-neutral-100 border border-neutral-500/40 shadow-sm'
  };
};

/**
 * Image Orientation Helper (Beginner-friendly & simple)
 * Photo dimensions (width & height) se orientation calculate karta hai:
 * - landscape: jab width height se badi ho
 * - portrait: jab height width se badi ho
 * - square: jab width aur height lagbhag barabar ho
 */
export const getImageOrientation = (dimensions, img = {}) => {
  // 1. Agar image me pehle se orientation string ho
  if (img?.orientation) {
    const o = String(img.orientation).toLowerCase();
    if (o.includes('land') || o.includes('horiz')) return 'landscape';
    if (o.includes('port') || o.includes('vert')) return 'portrait';
    if (o.includes('squar')) return 'square';
  }

  // 2. Width aur height number me convert karte hain
  const width = Number(dimensions?.width || img?.width) || 0;
  const height = Number(dimensions?.height || img?.height) || 0;

  // Agar width aur height available nahi hai to default landscape
  if (!width || !height) return 'landscape';

  const ratio = width / height;

  // Square: ratio 0.90 se 1.10 ke beech ho (lagbhag barabar)
  if (ratio >= 0.90 && ratio <= 1.10) {
    return 'square';
  }

  // Landscape: Width height se badi ho
  if (width > height) {
    return 'landscape';
  }

  // Portrait: Height width se badi ho
  return 'portrait';
};

