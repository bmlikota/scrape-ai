import Parser from 'rss-parser';
import { RSS_FEED_URLS } from '../config/constants.js';

/**
 * RssClient
 * Single Responsibility: RSS feed parsing
 * Handles all RSS-related operations
 */
export class RssClient {
  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['description', 'content:encoded', 'pubDate']
      }
    });
  }

  /**
   * Fetches and parses RSS feed
   * @param {string} feedUrl - RSS feed URL
   * @returns {Promise<Object>} Parsed feed object
   * @throws {Error} If fetching or parsing fails
   */
  async fetchFeed(feedUrl) {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      return feed;
    } catch (error) {
      throw new Error(`Failed to fetch RSS feed from ${feedUrl}: ${error.message}`);
    }
  }

  /**
   * Fetches The Hacker News RSS feed
   * @returns {Promise<Object>}
   */
  async fetchTheHackerNewsFeed() {
    return this.fetchFeed(RSS_FEED_URLS.THE_HACKER_NEWS);
  }

  /**
   * Fetches Hacker News RSS feed
   * @returns {Promise<Object>}
   */
  async fetchHackerNewsFeed() {
    return this.fetchFeed(RSS_FEED_URLS.HACKER_NEWS);
  }
}

