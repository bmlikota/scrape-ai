import { NewsSource } from '../interfaces/NewsSource.js';
import { ApiClient } from '../clients/ApiClient.js';
import { ArticleMapper } from '../mappers/ArticleMapper.js';
import { NEWS_SOURCES } from '../config/constants.js';

/**
 * HackerNewsApiSource
 * Single Responsibility: Fetching articles from Hacker News API
 * Implements NewsSource interface (DIP)
 */
export class HackerNewsApiSource extends NewsSource {
  constructor(apiClient = new ApiClient()) {
    super();
    this.apiClient = apiClient;
  }

  /**
   * Fetches articles from Hacker News API
   * @param {number} limit - Maximum number of articles
   * @returns {Promise<Article[]>}
   */
  async fetchArticles(limit) {
    try {
      const storyIds = await this.apiClient.fetchTopStories();
      const topStoryIds = storyIds.slice(0, limit);
      const stories = await this.apiClient.fetchStories(topStoryIds);
      
      return stories
        .map(story => ArticleMapper.fromApiItem(story, this.getSourceName()))
        .filter(article => article !== null);
    } catch (error) {
      throw new Error(`Failed to fetch Hacker News API articles: ${error.message}`);
    }
  }

  /**
   * @returns {string}
   */
  getSourceName() {
    return NEWS_SOURCES.HACKER_NEWS_API;
  }
}

