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
    // If content is empty or very short, it's not full content
    if (!this.content || this.content.length < 200) {
      return false;
    }
    
    // If content is significantly longer than description, assume it's full content
    if (this.description && this.content.length > this.description.length * 2) {
      return true;
    }
    
    // If content and description are very similar (likely both snippets), it's not full content
    const similarity = this.calculateSimilarity(this.content, this.description);
    if (similarity > 0.8 && this.content.length < 1000) {
      return false;
    }
    
    // If content is substantial (>1000 chars), assume it's full content
    return this.content.length > 1000;
  }

  /**
   * Calculates simple similarity between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score between 0 and 1
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const shorter = s1.length < s2.length ? s1 : s2;
      const longer = s1.length >= s2.length ? s1 : s2;
      return shorter.length / longer.length;
    }
    
    return 0;
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

