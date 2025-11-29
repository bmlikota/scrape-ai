import fetch from 'node-fetch';
import { API_BASE_URLS } from '../config/constants.js';

/**
 * ApiClient
 * Single Responsibility: HTTP API communication
 * Handles all API-related operations
 */
export class ApiClient {
  constructor(baseUrl = API_BASE_URLS.HACKER_NEWS) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches data from API endpoint
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<Object>} JSON response
   * @throws {Error} If request fails
   */
  async fetch(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch from ${url}: ${error.message}`);
    }
  }

  /**
   * Fetches multiple items in parallel
   * @param {string} endpoint - Base endpoint
   * @param {number[]} ids - Array of item IDs
   * @returns {Promise<Object[]>} Array of fetched items
   */
  async fetchMultiple(endpoint, ids) {
    const fetchPromises = ids.map(id =>
      this.fetch(`${endpoint}/${id}.json`)
        .catch(error => {
          console.error(`Error fetching item ${id}:`, error.message);
          return null;
        })
    );

    const results = await Promise.all(fetchPromises);
    return results.filter(item => item !== null);
  }

  /**
   * Fetches top stories IDs (most upvoted/popular)
   * @returns {Promise<number[]>}
   */
  async fetchTopStories() {
    return this.fetch('/topstories.json');
  }

  /**
   * Fetches new stories IDs (latest/newest articles)
   * @returns {Promise<number[]>}
   */
  async fetchNewStories() {
    return this.fetch('/newstories.json');
  }

  /**
   * Fetches best stories IDs (highest quality)
   * @returns {Promise<number[]>}
   */
  async fetchBestStories() {
    return this.fetch('/beststories.json');
  }

  /**
   * Fetches story details
   * @param {number} storyId - Story ID
   * @returns {Promise<Object>}
   */
  async fetchStory(storyId) {
    return this.fetch(`/item/${storyId}.json`);
  }

  /**
   * Fetches multiple stories
   * @param {number[]} storyIds - Array of story IDs
   * @returns {Promise<Object[]>}
   */
  async fetchStories(storyIds) {
    return this.fetchMultiple('/item', storyIds);
  }
}

