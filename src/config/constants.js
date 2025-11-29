/**
 * Application Constants
 * Centralized configuration values
 */

export const DEFAULT_ARTICLE_LIMIT = 30;
export const MAX_ARTICLE_LIMIT = 100;
export const MIN_ARTICLE_LIMIT = 1;

export const DEFAULT_PORT = 3000;

export const NEWS_SOURCES = {
  THE_HACKER_NEWS: 'thehackernews',
  HACKER_NEWS: 'hackernews',
  HACKER_NEWS_RSS: 'hackernews-rss',
  HACKER_NEWS_API: 'hackernews-api'
};

export const RSS_FEED_URLS = {
  THE_HACKER_NEWS: 'https://feeds.feedburner.com/TheHackersNews',
  HACKER_NEWS: 'https://news.ycombinator.com/rss'
};

export const API_BASE_URLS = {
  HACKER_NEWS: 'https://hacker-news.firebaseio.com/v0'
};

export const SOURCE_ALIASES = {
  'thn': NEWS_SOURCES.THE_HACKER_NEWS,
  'hn': NEWS_SOURCES.HACKER_NEWS
};

