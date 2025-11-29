import { ArticleService } from '../services/ArticleService.js';
import { RequestValidator } from '../validators/RequestValidator.js';

/**
 * ArticleController
 * Single Responsibility: Handling HTTP requests and responses
 * Separates HTTP concerns from business logic
 */
export class ArticleController {
  constructor(articleService = new ArticleService()) {
    this.articleService = articleService;
  }

  /**
   * Handles GET /api/articles request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getArticles(req, res) {
    try {
      const validation = RequestValidator.validateArticleRequest(req.query);

      if (validation.errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      const articles = await this.articleService.fetchArticles(
        validation.limit,
        validation.source,
        validation.fetchFullContent
      );

      res.json({
        success: true,
        count: articles.length,
        articles: articles.map(article => article.toJSON())
      });
    } catch (error) {
      console.error('Error in ArticleController.getArticles:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

