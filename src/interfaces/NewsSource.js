/**
 * NewsSource Interface (Abstract Class)
 * Defines the contract that all news sources must implement
 * Follows Dependency Inversion Principle (DIP)
 */
export class NewsSource {
  /**
   * Fetches articles from the news source
   * @param {number} limit - Maximum number of articles to fetch
   * @returns {Promise<Article[]>} Array of Article objects
   * @throws {Error} If fetching fails
   */
  async fetchArticles(limit) {
    throw new Error('fetchArticles() must be implemented by subclass');
  }

  /**
   * Gets the source identifier
   * @returns {string}
   */
  getSourceName() {
    throw new Error('getSourceName() must be implemented by subclass');
  }
}

