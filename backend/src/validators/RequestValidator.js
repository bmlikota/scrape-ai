import { MAX_ARTICLE_LIMIT, MIN_ARTICLE_LIMIT, DEFAULT_ARTICLE_LIMIT } from '../config/constants.js';

/**
 * RequestValidator
 * Single Responsibility: Request validation
 * Validates and sanitizes incoming request parameters
 */
export class RequestValidator {
  /**
   * Validates article request parameters
   * @param {Object} queryParams - Request query parameters
   * @returns {{limit: number, source: string, fetchFullContent: boolean, ids: string[], errors: string[]}}
   */
  static validateArticleRequest(queryParams) {
    const errors = [];
    let limit = DEFAULT_ARTICLE_LIMIT;
    let source = null;
    let fetchFullContent = false;
    let ids = [];

    // Validate IDs (optional, comma-separated or array)
    if (queryParams.ids !== undefined) {
      if (typeof queryParams.ids === 'string') {
        // Comma-separated string
        ids = queryParams.ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
      } else if (Array.isArray(queryParams.ids)) {
        ids = queryParams.ids.map(id => String(id).trim()).filter(id => id.length > 0);
      } else {
        errors.push('ids must be a string (comma-separated) or array');
      }

      if (ids.length === 0 && queryParams.ids !== undefined) {
        errors.push('ids must contain at least one valid ID');
      }
    }

    // If IDs are provided, limit and source are optional
    if (ids.length === 0) {
      // Validate limit
      if (queryParams.limit !== undefined) {
        const parsedLimit = parseInt(queryParams.limit, 10);
        
        if (isNaN(parsedLimit)) {
          errors.push('Limit must be a valid number');
        } else if (parsedLimit < MIN_ARTICLE_LIMIT) {
          errors.push(`Limit must be at least ${MIN_ARTICLE_LIMIT}`);
        } else if (parsedLimit > MAX_ARTICLE_LIMIT) {
          errors.push(`Limit must not exceed ${MAX_ARTICLE_LIMIT}`);
        } else {
          limit = parsedLimit;
        }
      }

      // Validate source (optional)
      if (queryParams.source !== undefined) {
        if (typeof queryParams.source !== 'string' || queryParams.source.trim() === '') {
          errors.push('Source must be a non-empty string');
        } else {
          source = queryParams.source.trim();
        }
      }
    }

    // Validate fetchFullContent (optional boolean)
    if (queryParams.fetchFullContent !== undefined) {
      const value = queryParams.fetchFullContent.toLowerCase();
      if (value === 'true' || value === '1') {
        fetchFullContent = true;
      } else if (value !== 'false' && value !== '0') {
        errors.push('fetchFullContent must be a boolean value (true/false)');
      }
    }

    return { limit, source, fetchFullContent, ids, errors };
  }
}

