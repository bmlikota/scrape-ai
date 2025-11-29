import { NewsSource } from '../interfaces/NewsSource.js';
import { HackerNewsApiSource } from './HackerNewsApiSource.js';
import { HackerNewsRssSource } from './HackerNewsRssSource.js';
import { NEWS_SOURCES } from '../config/constants.js';

/**
 * HackerNewsSource
 * Single Responsibility: Fetching articles with API fallback to RSS
 * Implements NewsSource interface (DIP)
 * Uses Strategy pattern for fallback mechanism
 */
export class HackerNewsSource extends NewsSource {
  constructor(
    apiSource = new HackerNewsApiSource(undefined, 'new'), // Default to 'new' for latest articles
    rssSource = new HackerNewsRssSource()
  ) {
    super();
    this.apiSource = apiSource;
    this.rssSource = rssSource;
  }

  /**
   * Fetches articles, trying API first, falling back to RSS
   * @param {number} limit - Maximum number of articles
   * @returns {Promise<Article[]>}
   */
  async fetchArticles(limit) {
    try {
      return await this.apiSource.fetchArticles(limit);
    } catch (error) {
      console.warn('Hacker News API failed, falling back to RSS:', error.message);
      return await this.rssSource.fetchArticles(limit);
    }
  }

  /**
   * @returns {string}
   */
  getSourceName() {
    return NEWS_SOURCES.HACKER_NEWS;
  }
}

