import { Article } from '../models/Article.js';

/**
 * ArticleMapper
 * Maps raw data from different sources to Article domain model
 * Single Responsibility: Data transformation
 */
export class ArticleMapper {
  /**
   * Maps RSS feed item to Article
   * @param {Object} rssItem - Raw RSS item
   * @param {string} source - Source identifier
   * @param {number} index - Item index for ID generation
   * @returns {Article}
   */
  static fromRssItem(rssItem, source, index = 0) {
    // Extract description: always use plain text version (contentSnippet or extracted)
    const description = rssItem.contentSnippet || 
                       this.extractPlainText(rssItem.content) || 
                       this.extractPlainText(rssItem.description) || 
                       '';

    // Extract content: prefer content:encoded (full HTML), then content (may be HTML)
    // If content appears to be the same as description (snippet only), keep it but mark as incomplete
    let content = rssItem['content:encoded'] || rssItem.content || rssItem.description || '';
    
    // If content is HTML, keep it; if it's the same as description (plain text), it's likely incomplete
    const contentPlainText = this.extractPlainText(content);
    if (contentPlainText === description && description.length > 0) {
      // Content appears to be just a snippet - keep HTML version if available, otherwise empty
      // This signals that full content needs to be fetched
      content = rssItem['content:encoded'] || rssItem.content || '';
    }

    return new Article({
      id: this.generateId(source, index),
      title: rssItem.title || '',
      link: rssItem.link || '',
      description: description,
      content: content,
      pubDate: rssItem.pubDate || rssItem.isoDate || new Date().toISOString(),
      author: rssItem.creator || rssItem.author || 'Unknown',
      source: source,
      categories: this.extractCategories(rssItem)
    });
  }

  /**
   * Maps Hacker News API item to Article
   * @param {Object} apiItem - Raw API item
   * @param {string} source - Source identifier
   * @returns {Article|null} Returns null if item is invalid
   */
  static fromApiItem(apiItem, source) {
    if (!this.isValidApiItem(apiItem)) {
      return null;
    }

    return new Article({
      id: this.generateId(source, apiItem.id),
      title: apiItem.title || '',
      link: apiItem.url || this.generateHackerNewsLink(apiItem.id),
      description: '',
      content: '',
      pubDate: this.convertUnixTimestamp(apiItem.time),
      author: apiItem.by || 'Unknown',
      source: source,
      score: apiItem.score || 0,
      comments: apiItem.descendants || 0,
      categories: []
    });
  }

  /**
   * Extracts categories from RSS item
   * @param {Object} item - RSS item
   * @returns {string[]}
   */
  static extractCategories(item) {
    const categories = [];

    if (Array.isArray(item.categories)) {
      categories.push(...item.categories);
    }

    if (item['dc:subject']) {
      categories.push(item['dc:subject']);
    }

    return categories;
  }

  /**
   * Validates if API item is a valid story
   * @param {Object} item - API item
   * @returns {boolean}
   */
  static isValidApiItem(item) {
    return item && item.type === 'story' && item.url;
  }

  /**
   * Generates unique article ID
   * @param {string} source - Source identifier
   * @param {string|number} identifier - Unique identifier
   * @returns {string}
   */
  static generateId(source, identifier) {
    return `${source}-${identifier}-${Date.now()}`;
  }

  /**
   * Converts Unix timestamp to ISO string
   * @param {number} timestamp - Unix timestamp in seconds
   * @returns {string} ISO date string
   */
  static convertUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Generates Hacker News discussion link
   * @param {number} itemId - Item ID
   * @returns {string}
   */
  static generateHackerNewsLink(itemId) {
    return `https://news.ycombinator.com/item?id=${itemId}`;
  }

  /**
   * Extracts plain text from HTML content
   * Simple HTML tag removal for basic text extraction
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  static extractPlainText(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

