/**
 * Visual Vault - Discovery Service
 * Combines our own users' uploaded images with live results from
 * Pixabay and Pexels, so one search returns images from all three
 * sources together.
 */

import { Image } from '../models/Image.js';
import { User } from '../models/User.js';
import { isDummyUser } from '../utils/isDummyUser.js';
import { pixabayService } from './pixabayService.js';
import { pexelsService } from './pexelsService.js';

// Turns one of our own database images into the same shape the
// external providers return, so the frontend can treat all results
// the same way regardless of source.
function formatVaultImage(img) {
  return {
    id: img._id,
    title: img.title,
    description: img.description,
    imageUrl: img.imageUrl,
    thumbnailUrl: img.thumbnailUrl || img.imageUrl,
    tags: img.tags || [],
    category: img.category || 'All Works',
    provider: 'Visual Vault',
    author: img.ownerName || 'Vault Member',
    ownerId: img.ownerId || null,
    dimensions: img.dimensions || { width: 1920, height: 1080 },
    likes: img.likeCount || 0,
    downloads: img.downloadCount || 0,
    license: 'Visual Vault Upload',
    isVaultAsset: true,
    createdAt: img.createdAt
  };
}

export const discoveryService = {
  /**
   * Main search: query Pixabay + Pexels at the same time (so one slow/
   * down provider doesn't block the other), plus filter our own
   * uploaded images, then combine everything into one result list.
   */
  async searchImages({ query = '', category = 'All Works', sort = 'popular', page = 1, limit = 12 }) {
    const cleanQuery = query.toLowerCase().trim();
    page = Number(page) || 1;
    limit = Number(limit) || 12;

    // 1. Get our own vault images matching the search
    let vaultImages = await Image.find({ isDeleted: false });
    if (cleanQuery) {
      vaultImages = vaultImages.filter(img =>
        (img.title || '').toLowerCase().includes(cleanQuery) ||
        (img.tags || []).some(t => t.toLowerCase().includes(cleanQuery))
      );
    } else if (category && category !== 'All Works') {
      vaultImages = vaultImages.filter(img => (img.category || '').toLowerCase() === category.toLowerCase());
    }

    if (sort === 'popular') {
      vaultImages.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else if (sort === 'downloads') {
      vaultImages.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sort === 'recent') {
      vaultImages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Vault images are paginated locally (their own page-N slice), instead
    // of pulling *all* of them into memory on every page — this is what
    // was previously causing duplicates and a skewed combined array.
    const vaultTotal = vaultImages.length;
    const vaultStart = (page - 1) * limit;
    const formattedVault = vaultImages.slice(vaultStart, vaultStart + limit).map(formatVaultImage);

    // 2. Get external results — Promise.allSettled means if one API is
    // down or rate-limited, we still get results from the other.
    // Each provider is asked for ITS OWN page `page`, and each already
    // returns its own real total (pixabayResult.value.total / pexelsResult.value.total).
    const [pixabayResult, pexelsResult] = await Promise.allSettled([
      pixabayService.search({ query, category, page, limit }),
      pexelsService.search({ query, category, page, limit })
    ]);

    const pixabayImages = pixabayResult.status === 'fulfilled' ? pixabayResult.value.images : [];
    const pexelsImages = pexelsResult.status === 'fulfilled' ? pexelsResult.value.images : [];
    const pixabayTotal = pixabayResult.status === 'fulfilled' ? (pixabayResult.value.total || 0) : 0;
    const pexelsTotal = pexelsResult.status === 'fulfilled' ? (pexelsResult.value.total || 0) : 0;

    // 3. Combine this page's slice from each source. NOTE: we do NOT
    // re-slice this with startIndex/limit again — each source has
    // already given us its own page's worth of results, so re-slicing
    // here was silently throwing most of the results away and capping
    // the app at ~2x the per-provider limit no matter how many results
    // actually existed on Pixabay/Pexels.
    let paginatedImages = [...formattedVault, ...pixabayImages, ...pexelsImages];

    if (sort === 'popular') {
      paginatedImages.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (sort === 'downloads') {
      paginatedImages.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sort === 'recent') {
      // Only our own vault images have a real createdAt date — external
      // API results don't, so we keep them after all the dated ones
      // instead of sorting them randomly among the dates.
      paginatedImages.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    // any other/unrecognized sort value just keeps the natural combined order

    // Real total across every source, not just what happened to be
    // fetched on this page — this is what actually fixes the "stuck
    // around 40" cap, since `total` now reflects Pixabay/Pexels' real
    // totalHits/total_results instead of this page's array length.
    const total = vaultTotal + pixabayTotal + pexelsTotal;

    // "hasMore" needs to check every source independently, since each
    // one can run out of pages at a different point.
    const vaultTotalPages = Math.max(Math.ceil(vaultTotal / limit), 1);
    const pixabayTotalPages = Math.max(Math.ceil(pixabayTotal / limit), 1);
    const pexelsTotalPages = Math.max(Math.ceil(pexelsTotal / limit), 1);
    const totalPages = Math.max(vaultTotalPages, pixabayTotalPages, pexelsTotalPages, 1);
    const hasMore = page < totalPages;

    return {
      images: paginatedImages,
      total,
      page,
      totalPages,
      hasMore,
      pixabayActive: pixabayService.isConfigured(),
      pexelsActive: pexelsService.isConfigured()
    };
  },

  /**
   * Explore page: a few simple, honest sections built from real data —
   * no artificial "rotation cycles" or made-up scoring formulas.
   */
  async getExploreSections() {
    const vaultImages = await Image.find({ isDeleted: false });
    const formatted = vaultImages.map(formatVaultImage);

    const mostLiked = [...formatted].sort((a, b) => b.likes - a.likes).slice(0, 10);
    const mostDownloaded = [...formatted].sort((a, b) => b.downloads - a.downloads).slice(0, 10);
    const newest = [...formatted].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    // Group images by category for a simple "Browse by Category" section
    const categoryMap = new Map();
    formatted.forEach(img => {
      const cat = img.category || 'Uncategorized';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { name: cat, count: 0, sampleImage: img.thumbnailUrl });
      }
      categoryMap.get(cat).count += 1;
    });

    // Real creators only — filters out the built-in demo accounts
    const users = await User.find();
    const creators = users
      .filter(u => !isDummyUser(u) && formatted.some(img => img.ownerId === u._id))
      .map(u => {
        const works = formatted.filter(img => img.ownerId === u._id);
        return {
          id: u._id,
          name: u.name,
          avatar: u.avatar,
          totalUploads: works.length,
          totalLikes: works.reduce((sum, w) => sum + w.likes, 0)
        };
      });

    return {
      mostLiked,
      mostDownloaded,
      newest,
      popularCategories: Array.from(categoryMap.values()),
      topCreators: creators
    };
  }
};