import { NewsSource } from '../interfaces/NewsSource.js';
import { RssClient } from '../clients/RssClient.js';
import { ArticleMapper } from '../mappers/ArticleMapper.js';
import { NEWS_SOURCES } from '../config/constants.js';

/**
 * TheHackerNewsSource
 * Single Responsibility: Fetching articles from The Hacker News RSS
 * Implements NewsSource interface (DIP)
 */
export class TheHackerNewsSource extends NewsSource {
  constructor(rssClient = new RssClient()) {
    super();
    this.rssClient = rssClient;
  }

  /**
   * Fetches articles from The Hacker News RSS feed
   * @param {number} limit - Maximum number of articles
   * @returns {Promise<Article[]>}
   */
  async fetchArticles(limit) {
    try {
      const feed = await this.rssClient.fetchTheHackerNewsFeed();
      const items = feed.items.slice(0, limit);
      
      return items.map((item, index) =>
        ArticleMapper.fromRssItem(item, this.getSourceName(), index)
      );
    } catch (error) {
      throw new Error(`Failed to fetch The Hacker News articles: ${error.message}`);
    }
  }

  /**
   * @returns {string}
   */
  getSourceName() {
    return NEWS_SOURCES.THE_HACKER_NEWS;
  }
}

