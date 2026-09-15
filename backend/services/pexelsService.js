/**
 * Visual Vault - Pexels Service
 * Talks to the real Pexels API (https://www.pexels.com/api/documentation/).
 * If no API key is set, or the request fails, it returns an empty
 * result — no fake/sample images or made-up like/download counts.
 */

export const pexelsService = {
  isConfigured() {
    return Boolean(process.env.PEXELS_API_KEY && process.env.PEXELS_API_KEY.trim() !== '');
  },

  async search({ query = '', category = 'All Works', page = 1, limit = 12 }) {
    const apiKey = process.env.PEXELS_API_KEY?.trim();
    if (!apiKey) {
      return { images: [], total: 0, isLive: false };
    }

    let searchTerm = query.trim();
    if (!searchTerm && category && category !== 'All Works' && category !== 'all') {
      searchTerm = category.replace('&', '').toLowerCase();
    }

    // Pexels has two endpoints: /search for a keyword, /curated for
    // a general "popular photos" feed when there's no search term.
    const endpoint = searchTerm
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&page=${page}&per_page=${Math.min(limit, 50)}`
      : `https://api.pexels.com/v1/curated?page=${page}&per_page=${Math.min(limit, 50)}`;

    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(7000)
      });

      if (!response.ok) {
        console.warn(`[Pexels] API responded with status ${response.status}`);
        return { images: [], total: 0, isLive: false };
      }

      const data = await response.json();
      const photos = Array.isArray(data?.photos) ? data.photos : [];

      const images = photos.map(photo => ({
        id: `pexels_${photo.id}`,
        title: photo.alt?.trim() || `Pexels Photo #${photo.id}`,
        description: photo.alt || 'Photo licensed through Pexels.',
        imageUrl: photo.src?.large2x || photo.src?.original || photo.src?.large,
        thumbnailUrl: photo.src?.large || photo.src?.medium,
        tags: photo.alt ? photo.alt.toLowerCase().split(' ').filter(w => w.length > 2) : [],
        category: category !== 'All Works' && category !== 'all' ? category : 'Photography',
        provider: 'Pexels',
        author: photo.photographer || 'Pexels Photographer',
        authorUrl: photo.photographer_url || photo.url,
        dimensions: { width: photo.width || 1920, height: photo.height || 1080 },
        // Pexels' API doesn't expose like/download counts, so we honestly
        // show 0 instead of making up numbers.
        likes: 0,
        downloads: 0,
        license: 'Pexels License (Free to use)'
      }));

      return { images, total: data.total_results || images.length, isLive: true };
    } catch (err) {
      console.warn('[Pexels] Request failed:', err.message);
      return { images: [], total: 0, isLive: false };
    }
  }
};
