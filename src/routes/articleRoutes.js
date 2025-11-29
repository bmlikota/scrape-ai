import express from 'express';
import { ArticleController } from '../controllers/ArticleController.js';

/**
 * Article Routes
 * Single Responsibility: Route definitions
 * Separates routing from controller logic
 */
export function createArticleRoutes(articleController = new ArticleController()) {
  const router = express.Router();

  router.get('/', (req, res) => articleController.getArticles(req, res));

  return router;
}

