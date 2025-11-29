import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 15000 // 15 second timeout
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
   * Extracts main article content from HTML using cheerio
   * Handles various website structures including The Hacker News
   * @param {string} html - HTML content
   * @param {string} url - Article URL for domain-specific extraction
   * @returns {string} Extracted text content
   */
  extractArticleText(html, url = '') {
    if (!html) {
      return '';
    }

    try {
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, noscript, nav, header, footer, aside, .advertisement, .ads, .sidebar, .social-share, .comments').remove();

      // Domain-specific extraction strategies
      const domain = new URL(url).hostname.toLowerCase();
      
      let content = '';

      // The Hacker News specific selectors
      if (domain.includes('thehackernews.com')) {
        // Try multiple selectors for The Hacker News
        const selectors = [
          'article .articlebody',
          'article .post-content',
          '.articlebody',
          '.post-content',
          'article .entry-content',
          '.entry-content',
          'article p',
          'main article',
          'article'
        ];

        for (const selector of selectors) {
          const $content = $(selector);
          if ($content.length > 0) {
            // Get text from the main article container
            content = $content.first().text();
            if (content.length > 500) { // If we got substantial content
              break;
            }
          }
        }
      } else {
        // Generic article extraction
        const selectors = [
          'article',
          '[role="article"]',
          '.article-content',
          '.post-content',
          '.entry-content',
          '.content',
          'main',
          '.article-body',
          '.post-body'
        ];

        for (const selector of selectors) {
          const $content = $(selector);
          if ($content.length > 0) {
            content = $content.first().text();
            if (content.length > 500) {
              break;
            }
          }
        }
      }

      // Fallback: extract all paragraphs if no main content found
      if (content.length < 500) {
        const paragraphs = $('article p, .article p, main p, .content p');
        if (paragraphs.length > 0) {
          content = paragraphs.map((i, el) => $(el).text()).get().join(' ');
        }
      }

      // Clean up the text
      return content
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
        .trim();
    } catch (error) {
      console.warn('Error parsing HTML with cheerio, falling back to regex:', error.message);
      // Fallback to simple regex extraction
      return this.extractArticleTextFallback(html);
    }
  }

  /**
   * Fallback method for HTML extraction using regex
   * @param {string} html - HTML content
   * @returns {string} Extracted text
   */
  extractArticleTextFallback(html) {
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Try to find main content areas
    const contentSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*articlebody[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
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
    return this.extractArticleText(html, url);
  }
}

