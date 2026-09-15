/**
 * Visual Vault - Discovery Controller
 * Handles the search bar, trending search suggestions, provider status,
 * and the "Explore" page sections.
 */

import { discoveryService } from '../services/discoveryService.js';
import { pixabayService } from '../services/pixabayService.js';
import { pexelsService } from '../services/pexelsService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const discoveryController = {
  // Search across our own vault + Pixabay + Pexels together
  async search(req, res, next) {
    try {
      const { q = '', query = '', category = 'All Works', sort = 'popular', page = 1, limit = 12 } = req.query;
      const searchTerm = (query || q || '').trim();

      const results = await discoveryService.searchImages({
        query: searchTerm,
        category,
        sort,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 12
      });

      return sendSuccess(res, 'Images discovered successfully', results);
    } catch (error) {
      next(error);
    }
  },

  // A short, fixed list of example searches shown on the homepage
  // to help users get started (not calculated from real trends).
  async getTrending(req, res, next) {
    try {
      const trendingTopics = ['Sports car at night', 'Minimal desk setup', 'Mountain landscape', 'Golden retriever puppy'];
      const categories = ['All Works', 'Nature & Landscape', 'Architecture', 'Street & Urban', 'Minimalism', 'Portraits'];
      return sendSuccess(res, 'Trending search topics loaded', { trendingTopics, categories });
    } catch (error) {
      next(error);
    }
  },

  // Shows whether Pixabay/Pexels are actually connected (useful for
  // debugging, and for a small "connected sources" indicator in the UI)
  async getProviders(req, res, next) {
    try {
      const providers = [
        { name: 'Visual Vault', status: 'Connected', type: 'Your uploads', isLive: true },
        { name: 'Pixabay', status: pixabayService.isConfigured() ? 'Connected' : 'Not configured', isLive: pixabayService.isConfigured() },
        { name: 'Pexels', status: pexelsService.isConfigured() ? 'Connected' : 'Not configured', isLive: pexelsService.isConfigured() }
      ];
      return sendSuccess(res, 'Connected stock providers loaded', providers);
    } catch (error) {
      next(error);
    }
  },

  // Explore page sections: most liked, most downloaded, newest, categories, creators
  async getExploreSections(req, res, next) {
    try {
      const data = await discoveryService.getExploreSections();
      return sendSuccess(res, 'Explore sections loaded successfully', data);
    } catch (error) {
      next(error);
    }
  }
};
