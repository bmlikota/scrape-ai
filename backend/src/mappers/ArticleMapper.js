import { Article } from '../models/Article.js';

/**
 * ArticleMapper
 * Maps raw data from different sources to Article domain model
 * Single Responsibility: Data transformation
 */
export class ArticleMapper {
  /**
   * Maps RSS feed item to Article
   * Uses URL as stable identifier since RSS doesn't provide unique IDs
   * @param {Object} rssItem - Raw RSS item
   * @param {string} source - Source identifier
   * @param {number} index - Item index (fallback if no link)
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

    // Use URL as stable identifier for RSS items (URLs are unique per article)
    // Fallback to source-index if no link available
    const articleId = rssItem.link 
      ? this.generateId(source, rssItem.link)
      : this.generateId(source, index);

    return new Article({
      id: articleId,
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
   * Generates unique article ID for RSS items
   * Uses source + URL as stable identifier (URLs are unique per article)
   * @param {string} source - Source identifier
   * @param {string|number} identifier - Unique identifier (e.g., RSS URL, fallback index)
   * @returns {string}
   */
  static generateId(source, identifier) {
    // Use stable ID without timestamp to ensure same article = same ID
    // This allows proper deduplication in the database
    // Format: source-url (URL is unique per article)
    return `${source}-${identifier}`;
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

