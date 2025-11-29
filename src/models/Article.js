/**
 * Article Domain Model
 * Represents a news article with all its properties
 */
export class Article {
  constructor({
    id,
    title,
    link,
    description = '',
    content = '',
    pubDate,
    author = '',
    source,
    categories = [],
    score = 0,
    comments = 0
  }) {
    this.id = id;
    this.title = title;
    this.link = link;
    this.description = description;
    this.content = content;
    this.pubDate = pubDate;
    this.author = author;
    this.source = source;
    this.categories = categories;
    this.score = score;
    this.comments = comments;
  }

  /**
   * Validates that the article has required fields
   * @returns {boolean}
   */
  isValid() {
    return !!(this.id && this.title && this.link && this.pubDate);
  }

  /**
   * Updates the content of the article
   * @param {string} newContent - New content to set
   */
  updateContent(newContent) {
    this.content = newContent || this.content;
  }

  /**
   * Checks if article has full content (not just a snippet)
   * @returns {boolean}
   */
  hasFullContent() {
    // If content is significantly longer than description, assume it's full content
    return this.content.length > this.description.length * 1.5;
  }

  /**
   * Converts article to plain object for JSON serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      link: this.link,
      description: this.description,
      content: this.content,
      pubDate: this.pubDate,
      author: this.author,
      source: this.source,
      categories: this.categories,
      score: this.score,
      comments: this.comments
    };
  }
}

