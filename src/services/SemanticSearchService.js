import { ArticleRepository } from '../repositories/ArticleRepository.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Logger } from '../utils/Logger.js';

/**
 * SemanticSearchService
 * Single Responsibility: Semantic search using vector similarity
 * Converts user prompt to embedding and finds similar articles
 */
export class SemanticSearchService {
  constructor(articleRepository, embeddingService) {
    this.repository = articleRepository;
    this.embeddingService = embeddingService;
  }

  /**
   * Searches articles by semantic similarity to user prompt
   * @param {string} prompt - User search prompt
   * @param {number} limit - Maximum number of results
   * @param {number} similarityThreshold - Minimum similarity score (0-1)
   * @returns {Promise<Array>} Articles ordered by relevance
   */
  async search(prompt, limit = 10, similarityThreshold = 0.7) {
    const startTime = Date.now();

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Search prompt cannot be empty');
    }

    try {
      Logger.info('Starting semantic search', {
        prompt: prompt.substring(0, 100),
        limit,
        similarityThreshold
      });

      // Generate embedding for user prompt
      const queryEmbedding = await this.embeddingService.generateEmbedding(prompt);

      Logger.debug('Query embedding generated, searching database', {
        embeddingDimensions: queryEmbedding.length
      });

      // Find similar articles using vector similarity (includes chunked articles)
      const articles = await this.repository.findBySimilarityWithChunks(
        queryEmbedding,
        limit,
        similarityThreshold
      );

      const duration = Date.now() - startTime;
      
      Logger.success('Semantic search completed', {
        resultsFound: articles.length,
        duration: `${duration}ms`,
        averageSimilarity: articles.length > 0 
          ? (articles.reduce((sum, a) => sum + a.similarity, 0) / articles.length).toFixed(3)
          : 0
      });

      if (articles.length > 0) {
        Logger.debug('Top results', {
          top3: articles.slice(0, 3).map(a => ({
            title: a.title.substring(0, 50),
            similarity: a.similarity.toFixed(3)
          }))
        });
      }

      return articles;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Semantic search failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }
}

