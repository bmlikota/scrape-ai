import { NewsSourceFactory } from '../factories/NewsSourceFactory.js';
import { ContentFetcher } from './ContentFetcher.js';
import { DEFAULT_ARTICLE_LIMIT } from '../config/constants.js';

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
    const source = sourceIdentifier
      ? NewsSourceFactory.create(sourceIdentifier)
      : NewsSourceFactory.createDefault();

    const articles = await source.fetchArticles(limit);

    // Optionally enrich articles with full content
    if (fetchFullContent) {
      await this.enrichWithFullContent(articles);
    }

    return articles;
  }

  /**
   * Enriches articles with full content fetched from their URLs
   * @param {Article[]} articles - Articles to enrich
   * @returns {Promise<void>}
   */
  async enrichWithFullContent(articles) {
    const fetchPromises = articles.map(async (article) => {
      // Only fetch if content appears to be incomplete
      if (!article.hasFullContent() && article.link) {
        try {
          const fullContent = await this.contentFetcher.fetchArticleContent(article.link);
          if (fullContent && fullContent.length > article.content.length) {
            article.updateContent(fullContent);
          }
        } catch (error) {
          console.warn(`Failed to fetch full content for ${article.link}:`, error.message);
          // Continue with existing content if fetch fails
        }
      }
    });

    await Promise.all(fetchPromises);
  }
}

