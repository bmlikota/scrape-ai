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
  async search(prompt, limit = 10, similarityThreshold = 0.2) {
    const startTime = Date.now();

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Search prompt cannot be empty');
    }

    try {
      Logger.info('🔍 === SEMANTIC SEARCH STARTED ===', {
        prompt: prompt.substring(0, 100),
        promptLength: prompt.length,
        limit,
        similarityThreshold
      });

      // Check database first
      const articleCount = await this.repository.count();
      Logger.info('📊 Database status', {
        totalArticles: articleCount,
        hasArticles: articleCount > 0
      });

      if (articleCount === 0) {
        Logger.warn('⚠️ No articles in database - search will return empty results');
        return {
          articles: [],
          metadata: {
            queryTokens: 0,
            resultsCount: 0,
            averageSimilarity: 0,
            averageRelevance: 0,
            searchDuration: `${Date.now() - startTime}ms`,
            warning: 'No articles in database'
          }
        };
      }

      // Generate embedding for user prompt
      Logger.info('🔄 Generating embedding for query...', {
        promptPreview: prompt.substring(0, 50)
      });
      
      const embeddingResult = await this.embeddingService.generateEmbedding(prompt);
      const queryEmbedding = embeddingResult.embedding;

      Logger.success('✅ Query embedding generated', {
        embeddingDimensions: queryEmbedding.length,
        tokens: embeddingResult.tokens,
        embeddingPreview: queryEmbedding.slice(0, 5).map(v => v.toFixed(4))
      });

      // Find similar articles using vector similarity (includes chunked articles)
      Logger.info('🔎 Searching database for similar articles...', {
        queryEmbeddingLength: queryEmbedding.length,
        limit,
        similarityThreshold,
        minRelevance: `${(similarityThreshold * 100).toFixed(1)}%`
      });

      const articles = await this.repository.findBySimilarityWithChunks(
        queryEmbedding,
        limit,
        similarityThreshold
      );

      Logger.info('📋 Database search completed', {
        resultsFound: articles.length,
        requestedLimit: limit,
        similarityThreshold: similarityThreshold
      });

      const duration = Date.now() - startTime;
      
      Logger.info('📊 Processing search results...', {
        rawResultsCount: articles.length
      });

      // Enhance articles with metadata
      const enhancedArticles = articles.map((article, index) => {
        const relevance = parseFloat((article.similarity * 100).toFixed(2));
        const similarity = parseFloat(article.similarity.toFixed(4));
        const distance = parseFloat((1 - article.similarity).toFixed(4));
        
        Logger.debug(`📄 Result ${index + 1}`, {
          articleId: article.articleId,
          title: article.title.substring(0, 60),
          similarity: similarity,
          relevance: `${relevance}%`,
          distance: distance
        });

        return {
          ...article,
          relevance: relevance,
          similarity: similarity,
          distance: distance
        };
      });

      const avgSimilarity = articles.length > 0 
        ? (articles.reduce((sum, a) => sum + a.similarity, 0) / articles.length)
        : 0;

      Logger.success('✅ === SEMANTIC SEARCH COMPLETED ===', {
        resultsFound: articles.length,
        requestedLimit: limit,
        duration: `${duration}ms`,
        averageSimilarity: avgSimilarity.toFixed(4),
        averageRelevance: `${(avgSimilarity * 100).toFixed(2)}%`,
        queryTokens: embeddingResult.tokens,
        similarityThreshold: similarityThreshold
      });

      if (articles.length === 0) {
        Logger.warn('⚠️ No articles found matching criteria', {
          possibleReasons: [
            'Similarity threshold too high',
            'No articles in database',
            'Query embedding not matching any article embeddings',
            'Query topic may not match article topics'
          ],
          suggestions: [
            `Try lowering similarityThreshold (current: ${similarityThreshold}, recommended: 0.1-0.3)`,
            'Check if articles exist in database',
            'Try a different search query',
            'Note: Very low similarity scores (< 0.3) may indicate articles are not relevant to your query'
          ]
        });
      } else {
        // Check if results have very low similarity (might not be relevant)
        const avgSimilarity = articles.reduce((sum, a) => sum + a.similarity, 0) / articles.length;
        if (avgSimilarity < 0.3) {
          Logger.warn('⚠️ Low similarity scores detected', {
            averageSimilarity: avgSimilarity.toFixed(4),
            averageRelevance: `${(avgSimilarity * 100).toFixed(2)}%`,
            warning: 'Results may not be highly relevant to your query. Consider refining your search terms.'
          });
        }
        Logger.info('🎯 Top 3 results:', {
          topResults: enhancedArticles.slice(0, 3).map((a, i) => ({
            rank: i + 1,
            title: a.title.substring(0, 60),
            relevance: `${a.relevance}%`,
            similarity: a.similarity.toFixed(4),
            articleId: a.articleId
          }))
        });
      }

      return {
        articles: enhancedArticles,
        metadata: {
          queryTokens: embeddingResult.tokens,
          resultsCount: articles.length,
          averageSimilarity: parseFloat(avgSimilarity.toFixed(4)),
          averageRelevance: parseFloat((avgSimilarity * 100).toFixed(2)),
          searchDuration: `${duration}ms`
        }
      };
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

