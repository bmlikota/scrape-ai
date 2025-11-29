import express from 'express';
import { ArticleController } from '../controllers/ArticleController.js';

/**
 * Article Routes
 * Single Responsibility: Route definitions
 * Separates routing from controller logic
 */
export function createArticleRoutes(articleController = new ArticleController()) {
  const router = express.Router();

  // POST routes must come before GET /:id to avoid route conflicts
  // Store articles with embeddings
  router.post('/store', (req, res) => articleController.storeArticles(req, res));

  // Fetch, embed, and store articles in one call (for cronjobs)
  router.post('/fetch-and-store', (req, res) => articleController.fetchAndStoreArticles(req, res));

  // Semantic search (supports both GET and POST)
  router.get('/search', (req, res) => articleController.searchArticles(req, res));
  router.post('/search', (req, res) => articleController.searchArticles(req, res));

  // Get articles by query parameters (source, limit, ids, etc.)
  router.get('/', (req, res) => articleController.getArticles(req, res));

  // Get single article by ID (RESTful route) - must be last to avoid catching POST routes
  // Only match if it looks like a valid ID (numeric or contains hyphens for article IDs)
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    // Reject common route names that might be mistaken as IDs
    if (['store', 'search', 'fetch-and-store'].includes(id)) {
      return res.status(404).json({
        success: false,
        error: `Route '${id}' not found. Use POST /api/articles/${id} instead.`
      });
    }
    return articleController.getArticleById(req, res);
  });

  return router;
}

