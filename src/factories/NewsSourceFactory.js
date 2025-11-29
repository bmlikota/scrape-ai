import { TheHackerNewsSource } from '../sources/TheHackerNewsSource.js';
import { HackerNewsSource } from '../sources/HackerNewsSource.js';
import { HackerNewsRssSource } from '../sources/HackerNewsRssSource.js';
import { HackerNewsApiSource } from '../sources/HackerNewsApiSource.js';
import { NEWS_SOURCES, SOURCE_ALIASES } from '../config/constants.js';

/**
 * NewsSourceFactory
 * Single Responsibility: Creating appropriate news source instances
 * Follows Factory Pattern and Open/Closed Principle (OCP)
 * Easy to extend with new sources without modifying existing code
 */
export class NewsSourceFactory {
  /**
   * Creates a news source instance based on source identifier
   * @param {string} sourceIdentifier - Source identifier or alias
   * @returns {NewsSource} News source instance
   * @throws {Error} If source identifier is invalid
   */
  static create(sourceIdentifier) {
    const normalizedSource = this.normalizeSourceIdentifier(sourceIdentifier);

    switch (normalizedSource) {
      case NEWS_SOURCES.THE_HACKER_NEWS:
        return new TheHackerNewsSource();

      case NEWS_SOURCES.HACKER_NEWS:
        return new HackerNewsSource();

      case NEWS_SOURCES.HACKER_NEWS_RSS:
        return new HackerNewsRssSource();

      case NEWS_SOURCES.HACKER_NEWS_API:
        return new HackerNewsApiSource();

      default:
        throw new Error(`Unknown news source: ${sourceIdentifier}`);
    }
  }

  /**
   * Normalizes source identifier (handles aliases and case)
   * @param {string} sourceIdentifier - Source identifier
   * @returns {string} Normalized source identifier
   */
  static normalizeSourceIdentifier(sourceIdentifier) {
    const lowercased = sourceIdentifier.toLowerCase();
    
    // Check aliases first
    if (SOURCE_ALIASES[lowercased]) {
      return SOURCE_ALIASES[lowercased];
    }
    
    return lowercased;
  }

  /**
   * Gets default news source
   * @returns {NewsSource}
   */
  static createDefault() {
    return new TheHackerNewsSource();
  }
}

