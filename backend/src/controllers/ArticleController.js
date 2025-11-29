import { ArticleService } from '../services/ArticleService.js';
import { RequestValidator } from '../validators/RequestValidator.js';
import { Logger } from '../utils/Logger.js';

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
      Logger.info('GET /api/articles request received', { query: req.query });

      const validation = RequestValidator.validateArticleRequest(req.query);

      if (validation.errors.length > 0) {
        Logger.warn('Validation failed', { errors: validation.errors });
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      let articles;

      // If IDs are provided, fetch by IDs
      if (validation.ids && validation.ids.length > 0) {
        Logger.info('Fetching articles by IDs', { count: validation.ids.length });
        articles = await this.articleService.fetchArticlesByIds(
          validation.ids,
          validation.fetchFullContent
        );
      } else {
        // Otherwise, fetch by source and limit
        Logger.info('Fetching articles by source', { 
          source: validation.source || 'default',
          limit: validation.limit,
          fetchFullContent: validation.fetchFullContent 
        });
        articles = await this.articleService.fetchArticles(
          validation.limit,
          validation.source,
          validation.fetchFullContent
        );
      }

      Logger.success('Articles fetched successfully', { count: articles.length });

      res.json({
        success: true,
        count: articles.length,
        articles: articles.map(article => article.toJSON())
      });
    } catch (error) {
      Logger.error('Error in getArticles', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handles GET /api/articles/:id request
   * Fetches a single article by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getArticleById(req, res) {
    try {
      const { id } = req.params;
      const fetchFullContent = req.query.fetchFullContent === 'true' || req.query.fetchFullContent === '1';

      // Reject route names that should be POST endpoints
      const reservedRoutes = ['store', 'search', 'fetch-and-store'];
      if (reservedRoutes.includes(id)) {
        Logger.warn('Attempted to access POST route via GET', { route: id });
        return res.status(405).json({
          success: false,
          error: `'${id}' is a POST endpoint. Use POST /api/articles/${id} instead of GET.`
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required'
        });
      }

      Logger.info('Fetching article by ID', { articleId: id, fetchFullContent });

      const articles = await this.articleService.fetchArticlesByIds(id, fetchFullContent);

      if (articles.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Article with ID '${id}' not found`
        });
      }

      res.json({
        success: true,
        article: articles[0].toJSON()
      });
    } catch (error) {
      console.error('Error in ArticleController.getArticleById:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handles POST /api/articles/store - Store articles with embeddings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async storeArticles(req, res) {
    const startTime = Date.now();
    
    try {
      Logger.info('POST /api/articles/store request received');

      const { articles } = req.body;

      if (!articles || !Array.isArray(articles) || articles.length === 0) {
        Logger.warn('Invalid request: articles array missing or empty');
        return res.status(400).json({
          success: false,
          error: 'Articles array is required and must not be empty'
        });
      }

      Logger.info('Storing articles', { count: articles.length });

      // Import services (circular dependency handling)
      const { ArticleStorageService } = await import('../services/ArticleStorageService.js');
      const storageService = new ArticleStorageService(
        req.app.locals.articleRepository,
        req.app.locals.embeddingService,
        req.app.locals.summarizationService || null
      );

      const result = await storageService.storeArticles(articles);

      const duration = Date.now() - startTime;
      Logger.success('Articles stored successfully', {
        total: articles.length,
        stored: result.stored,
        skipped: result.skipped,
        duration: `${duration}ms`
      });

      res.json({
        success: true,
        stored: result.stored,
        skipped: result.skipped,
        total: articles.length
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Error in storeArticles', {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handles POST /api/articles/search - Semantic search
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchArticles(req, res) {
    try {
      Logger.info(`${req.method} /api/articles/search request received`, {
        hasBody: !!req.body,
        hasQuery: !!req.query && Object.keys(req.query).length > 0,
        method: req.method,
        queryParams: req.query
      });

      // Handle both JSON body (POST) and query parameters (GET/POST)
      const prompt = (req.body && req.body.prompt) || req.query?.prompt;
      const limit = (req.body && req.body.limit) || req.query?.limit || 10;
      const similarityThreshold = (req.body && req.body.similarityThreshold) || req.query?.similarityThreshold || 0.2;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        Logger.warn('Invalid search request: prompt missing or empty', {
          prompt: prompt,
          hasBody: !!req.body,
          queryParams: req.query
        });
        return res.status(400).json({
          success: false,
          error: 'Search prompt is required.',
          usage: {
            'POST with JSON body': {
              'Content-Type': 'application/json',
              'body': { 'prompt': 'your search query', 'limit': 10, 'similarityThreshold': 0.7 }
            },
            'GET/POST with query params': {
              'url': '/api/articles/search?prompt=your+search+query&limit=10&similarityThreshold=0.7'
            }
          }
        });
      }

      Logger.info('Starting semantic search', {
        prompt: prompt.substring(0, 100),
        limit,
        similarityThreshold
      });

      // Import services
      const { SemanticSearchService } = await import('../services/SemanticSearchService.js');
      const searchService = new SemanticSearchService(
        req.app.locals.articleRepository,
        req.app.locals.embeddingService
      );

      const result = await searchService.search(
        prompt.trim(),
        parseInt(limit, 10),
        parseFloat(similarityThreshold)
      );

      Logger.success('Semantic search completed', { 
        resultsFound: result.articles.length,
        averageRelevance: result.metadata.averageRelevance
      });

      res.json({
        success: true,
        count: result.articles.length,
        limit: parseInt(limit, 10),
        similarityThreshold: parseFloat(similarityThreshold),
        articles: result.articles,
        metadata: result.metadata
      });
    } catch (error) {
      Logger.error('Error in searchArticles', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handles POST /api/articles/fetch-and-store - Fetch, embed, and store articles
   * Combines fetching articles, generating embeddings, and storing in database
   * Designed to be called manually or via cronjob
   * Fetches from The Hacker News (thehackernews.com) - Cybersecurity News Platform
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async fetchAndStoreArticles(req, res) {
    const startTime = Date.now();
    
    try {
      // Handle both JSON body and query parameters (for flexibility)
      // req.body might be undefined if Content-Type is not set or body is empty
      const limit = (req.body && req.body.limit) || req.query?.limit || 30;

      Logger.info('=== FETCH AND STORE REQUEST STARTED ===', { 
        limit,
        hasBody: !!req.body,
        method: req.method
      });

      // Validate limit
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        Logger.warn('Invalid limit parameter', { limit });
        return res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 100'
        });
      }

      Logger.step(1, 3, `Fetching ${parsedLimit} articles from The Hacker News (thehackernews.com)...`);

      // Step 1: Fetch articles from The Hacker News (thehackernews.com) with full content
      const articles = await this.articleService.fetchArticles(
        parsedLimit,
        'thehackernews', // Fixed to The Hacker News (thehackernews.com)
        true // fetchFullContent = true (required for embeddings)
      );

      if (articles.length === 0) {
        Logger.warn('No articles fetched from The Hacker News');
        return res.json({
          success: true,
          message: 'No articles fetched',
          fetched: 0,
          stored: 0,
          skipped: 0
        });
      }

      Logger.success(`Fetched ${articles.length} articles`, {
        articlesWithContent: articles.filter(a => a.hasFullContent()).length,
        articlesNeedingContent: articles.filter(a => !a.hasFullContent()).length
      });

      Logger.step(2, 3, 'Generating embeddings and storing articles...');

      // Step 2: Store articles with embeddings
      const { ArticleStorageService } = await import('../services/ArticleStorageService.js');
      const storageService = new ArticleStorageService(
        req.app.locals.articleRepository,
        req.app.locals.embeddingService,
        req.app.locals.summarizationService || null
      );

      const result = await storageService.storeArticles(articles);

      const totalDuration = Date.now() - startTime;
      Logger.step(3, 3, 'Process completed');

      Logger.success('=== FETCH AND STORE REQUEST COMPLETED ===', {
        fetched: articles.length,
        stored: result.stored,
        skipped: result.skipped,
        totalDuration: `${totalDuration}ms`,
        avgTimePerArticle: `${Math.round(totalDuration / articles.length)}ms`,
        tokens: result.tokens
      });

      res.json({
        success: true,
        message: 'Articles fetched and stored successfully',
        fetched: articles.length,
        stored: result.stored,
        skipped: result.skipped,
        tokens: result.tokens || {
          summary: 0,
          embedding: 0,
          total: 0
        }
      });
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      Logger.error('=== FETCH AND STORE REQUEST FAILED ===', {
        error: error.message,
        stack: error.stack,
        duration: `${totalDuration}ms`
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

