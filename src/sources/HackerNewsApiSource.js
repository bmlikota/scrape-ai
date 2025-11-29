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
  constructor(apiClient = new ApiClient(), storyType = 'new') {
    super();
    this.apiClient = apiClient;
    this.storyType = storyType; // 'new', 'top', or 'best'
  }

  /**
   * Fetches articles from Hacker News API
   * @param {number} limit - Maximum number of articles
   * @returns {Promise<Article[]>}
   */
  async fetchArticles(limit) {
    try {
      // Fetch story IDs based on type (default to 'new' for latest articles)
      let storyIds;
      switch (this.storyType.toLowerCase()) {
        case 'top':
          storyIds = await this.apiClient.fetchTopStories();
          break;
        case 'best':
          storyIds = await this.apiClient.fetchBestStories();
          break;
        case 'new':
        default:
          storyIds = await this.apiClient.fetchNewStories();
          break;
      }

      const selectedStoryIds = storyIds.slice(0, limit);
      const stories = await this.apiClient.fetchStories(selectedStoryIds);
      
      // Map to articles and filter out nulls
      const articles = stories
        .map(story => ArticleMapper.fromApiItem(story, this.getSourceName()))
        .filter(article => article !== null);
      
      // Sort by publication date (newest first) to maintain order
      // Since parallel requests may return in different order
      articles.sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime();
        const dateB = new Date(b.pubDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      return articles;
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

