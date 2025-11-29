import { NewsSource } from '../interfaces/NewsSource.js';
import { RssClient } from '../clients/RssClient.js';
import { ArticleMapper } from '../mappers/ArticleMapper.js';
import { NEWS_SOURCES } from '../config/constants.js';

/**
 * HackerNewsRssSource
 * Single Responsibility: Fetching articles from Hacker News RSS
 * Implements NewsSource interface (DIP)
 */
export class HackerNewsRssSource extends NewsSource {
  constructor(rssClient = new RssClient()) {
    super();
    this.rssClient = rssClient;
  }

  /**
   * Fetches articles from Hacker News RSS feed
   * @param {number} limit - Maximum number of articles
   * @returns {Promise<Article[]>}
   */
  async fetchArticles(limit) {
    try {
      const feed = await this.rssClient.fetchHackerNewsFeed();
      const items = feed.items.slice(0, limit);
      
      return items.map((item, index) =>
        ArticleMapper.fromRssItem(item, this.getSourceName(), index)
      );
    } catch (error) {
      throw new Error(`Failed to fetch Hacker News RSS articles: ${error.message}`);
    }
  }

  /**
   * @returns {string}
   */
  getSourceName() {
    return NEWS_SOURCES.HACKER_NEWS_RSS;
  }
}

