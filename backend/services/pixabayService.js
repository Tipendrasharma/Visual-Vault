/**
 * Visual Vault - Pixabay Service
 * Talks to the real Pixabay API (https://pixabay.com/api/docs/).
 * If no API key is set, or the request fails, it simply returns an
 * empty result — no fake/sample images are shown pretending to be real.
 */

export const pixabayService = {
  isConfigured() {
    return Boolean(process.env.PIXABAY_API_KEY && process.env.PIXABAY_API_KEY.trim() !== '');
  },

  async search({ query = '', category = 'All Works', page = 1, limit = 12 }) {
    const apiKey = process.env.PIXABAY_API_KEY?.trim();
    if (!apiKey) {
      return { images: [], total: 0, isLive: false };
    }

    // If the user didn't type a search term, use the category as a
    // reasonable default so the results still feel relevant.
    let searchTerm = query.trim();
    if (!searchTerm && category && category !== 'All Works' && category !== 'all') {
      searchTerm = category.replace('&', '').toLowerCase();
    }

    const url = searchTerm
      ? `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(searchTerm)}&image_type=photo&safesearch=true&page=${page}&per_page=${Math.min(limit, 50)}`
      : `https://pixabay.com/api/?key=${apiKey}&order=popular&image_type=photo&safesearch=true&page=${page}&per_page=${Math.min(limit, 50)}`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!response.ok) {
        console.warn(`[Pixabay] API responded with status ${response.status}`);
        return { images: [], total: 0, isLive: false };
      }

      const data = await response.json();
      const hits = Array.isArray(data?.hits) ? data.hits : [];

      // Turn Pixabay's response shape into our own app's shape, so the
      // frontend doesn't need to know which provider an image came from.
      const images = hits.map(hit => {
        const tagList = (hit.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        return {
          id: `pixabay_${hit.id}`,
          title: tagList.slice(0, 4).join(' ') || 'Pixabay Photo',
          description: `Photo tagged: ${tagList.join(', ')}`,
          imageUrl: hit.largeImageURL || hit.webformatURL,
          thumbnailUrl: hit.webformatURL || hit.previewURL,
          tags: tagList,
          category: category !== 'All Works' && category !== 'all' ? category : 'Photography',
          provider: 'Pixabay',
          author: hit.user || 'Pixabay Contributor',
          authorUrl: hit.pageURL,
          dimensions: { width: hit.imageWidth || 1920, height: hit.imageHeight || 1080 },
          likes: hit.likes || 0,
          downloads: hit.downloads || 0,
          license: 'Pixabay License (Free for commercial use)'
        };
      });

      return { images, total: data.totalHits || images.length, isLive: true };
    } catch (err) {
      console.warn('[Pixabay] Request failed:', err.message);
      return { images: [], total: 0, isLive: false };
    }
  }
};
