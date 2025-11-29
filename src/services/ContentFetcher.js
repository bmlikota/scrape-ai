import fetch from 'node-fetch';

/**
 * ContentFetcher
 * Single Responsibility: Fetching full article content from URLs
 * Used when RSS feeds only provide snippets
 */
export class ContentFetcher {
  /**
   * Fetches HTML content from a URL
   * @param {string} url - Article URL
   * @returns {Promise<string>} HTML content
   * @throws {Error} If fetching fails
   */
  async fetchContent(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch content from ${url}: ${error.message}`);
    }
  }

  /**
   * Extracts main article content from HTML
   * Simple extraction - can be enhanced with proper HTML parsing
   * @param {string} html - HTML content
   * @returns {string} Extracted text content
   */
  extractArticleText(html) {
    if (!html) {
      return '';
    }

    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Try to find main content areas (common article selectors)
    const contentSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i
    ];

    for (const selector of contentSelectors) {
      const match = text.match(selector);
      if (match && match[1]) {
        text = match[1];
        break;
      }
    }

    // Remove HTML tags and clean up
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Fetches and extracts article content from URL
   * @param {string} url - Article URL
   * @returns {Promise<string>} Extracted article text
   */
  async fetchArticleContent(url) {
    const html = await this.fetchContent(url);
    return this.extractArticleText(html);
  }
}

