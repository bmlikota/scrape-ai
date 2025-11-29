import { NewsSourceFactory } from '../factories/NewsSourceFactory.js';
import { ContentFetcher } from './ContentFetcher.js';
import { DEFAULT_ARTICLE_LIMIT } from '../config/constants.js';
import { Logger } from '../utils/Logger.js';

/**
 * ArticleService
 * Single Responsibility: Business logic for article operations
 * Orchestrates news sources and applies business rules
 */
export class ArticleService {
  constructor(contentFetcher = new ContentFetcher()) {
    this.contentFetcher = contentFetcher;
  }

  /**
   * Fetches articles from specified source
   * @param {number} limit - Maximum number of articles
   * @param {string} sourceIdentifier - Source identifier
   * @param {boolean} fetchFullContent - Whether to fetch full article content
   * @returns {Promise<Article[]>}
   */
  async fetchArticles(
    limit = DEFAULT_ARTICLE_LIMIT,
    sourceIdentifier = null,
    fetchFullContent = false
  ) {
    const startTime = Date.now();
    
    Logger.info('Fetching articles', {
      source: sourceIdentifier || 'default',
      limit,
      fetchFullContent
    });

    try {
      const source = sourceIdentifier
        ? NewsSourceFactory.create(sourceIdentifier)
        : NewsSourceFactory.createDefault();

      Logger.debug('News source created', { sourceName: source.getSourceName() });

      const articles = await source.fetchArticles(limit);
      
      Logger.success('Articles fetched from source', {
        count: articles.length,
        source: source.getSourceName()
      });

      // Optionally enrich articles with full content
      if (fetchFullContent) {
        Logger.info('Enriching articles with full content', { count: articles.length });
        await this.enrichWithFullContent(articles);
      }

      const duration = Date.now() - startTime;
      Logger.success('Article fetching completed', {
        total: articles.length,
        withFullContent: articles.filter(a => a.hasFullContent()).length,
        duration: `${duration}ms`
      });

      return articles;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Failed to fetch articles', {
        source: sourceIdentifier,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Fetches articles by their IDs
   * Note: RSS-based articles (thehackernews) use URL-based IDs
   * We can't fetch them by ID directly from the source, but we can look them up from the database
   * @param {string|string[]} ids - Single ID or array of IDs
   * @param {boolean} fetchFullContent - Whether to fetch full article content
   * @returns {Promise<Article[]>}
   */
  async fetchArticlesByIds(ids, fetchFullContent = false) {
    const idArray = Array.isArray(ids) ? ids : [ids];
    
    if (idArray.length === 0) {
      return [];
    }

    // Note: The Hacker News articles use URL-based IDs (e.g., "thehackernews-https://...")
    // We can't fetch them directly from RSS by ID, but we can look them up from the database
    // For now, return empty array - articles should be fetched from database instead
    Logger.warn('fetchArticlesByIds: RSS-based sources cannot be fetched by ID from source', {
      ids: idArray,
      note: 'Use database lookup instead (GET /api/articles/:id or database query)'
    });

    return [];
  }

  /**
   * Enriches articles with full content fetched from their URLs
   * @param {Article[]} articles - Articles to enrich
   * @returns {Promise<void>}
   */
  async enrichWithFullContent(articles) {
    Logger.info('Enriching articles with full content', { total: articles.length });
    
    const articlesNeedingContent = articles.filter(a => !a.hasFullContent() && a.link);
    const articlesWithContent = articles.filter(a => a.hasFullContent());

    Logger.debug('Content status', {
      needsContent: articlesNeedingContent.length,
      hasContent: articlesWithContent.length
    });

    const fetchPromises = articles.map(async (article) => {
      // Only fetch if content appears to be incomplete
      if (!article.hasFullContent() && article.link) {
        try {
          Logger.debug('Fetching full content', {
            articleId: article.id,
            url: article.link
          });
          
          const fullContent = await this.contentFetcher.fetchArticleContent(article.link);
          
          if (fullContent && fullContent.length > article.content.length) {
            article.updateContent(fullContent);
            Logger.success('Content fetched successfully', {
              articleId: article.id,
              contentLength: fullContent.length,
              improvement: `${fullContent.length - article.content.length} chars`
            });
          } else {
            Logger.warn('Content not improved', {
              articleId: article.id,
              originalLength: article.content.length,
              fetchedLength: fullContent?.length || 0
            });
          }
        } catch (error) {
          Logger.error('Failed to fetch full content', {
            articleId: article.id,
            url: article.link,
            error: error.message
          });
          // Continue with existing content if fetch fails
        }
      } else if (article.hasFullContent()) {
        Logger.debug('Article already has full content', {
          articleId: article.id,
          contentLength: article.content.length
        });
      }
    });

    await Promise.all(fetchPromises);
    
    const finalWithContent = articles.filter(a => a.hasFullContent()).length;
    Logger.success('Content enrichment completed', {
      total: articles.length,
      withFullContent: finalWithContent,
      withoutFullContent: articles.length - finalWithContent
    });
  }
}

