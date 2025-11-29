import { ArticleRepository } from '../repositories/ArticleRepository.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Logger } from '../utils/Logger.js';

/**
 * ArticleStorageService
 * Single Responsibility: Orchestrating article storage with embeddings
 * Handles deduplication and embedding generation
 */
export class ArticleStorageService {
  constructor(articleRepository, embeddingService, summarizationService = null) {
    this.repository = articleRepository;
    this.embeddingService = embeddingService;
    this.summarizationService = summarizationService;
  }

  /**
   * Stores article if it doesn't exist, generates embedding for full content
   * @param {Article} article - Article to store
   * @param {boolean} forceUpdate - Force update even if exists
   * @returns {Promise<{stored: boolean, article: Object}>}
   */
  async storeArticle(article, forceUpdate = false) {
    const startTime = Date.now();
    
    try {
      Logger.debug('Checking if article exists', { articleId: article.id });

      // Check if article already exists
      const exists = await this.repository.exists(article.id);

      if (exists && !forceUpdate) {
        Logger.info('Article already exists, skipping', { 
          articleId: article.id,
          title: article.title.substring(0, 50) 
        });
        return { stored: false, article: null };
      }

      // Ensure we have full content for embedding
      // Note: Some Hacker News articles (Ask HN, Show HN) don't have external URLs/content
      if (!article.content || article.content.length < 100) {
        Logger.warn('Article has insufficient content - skipping', { 
          articleId: article.id,
          title: article.title.substring(0, 50),
          contentLength: article.content?.length || 0,
          hasLink: !!article.link,
          reason: 'Article likely has no external URL (Ask HN, Show HN, or discussion-only post)'
        });
        throw new Error(`Article ${article.id} has insufficient content for embedding`);
      }

      Logger.info('Processing article for storage', {
        articleId: article.id,
        title: article.title.substring(0, 60),
        contentLength: article.content.length,
        source: article.source
      });

      // Generate summary before storing
      let summary = '';
      let summaryTokens = 0;
      if (this.summarizationService) {
        try {
          Logger.debug('Generating article summary', { articleId: article.id });
          const summaryResult = await this.summarizationService.generateSummary(
            article.title,
            article.content
          );
          summary = summaryResult.summary;
          summaryTokens = summaryResult.tokens;
          // Update article with summary
          article.summary = summary;
          Logger.success('Summary generated', {
            articleId: article.id,
            summaryLength: summary.length,
            tokens: summaryTokens
          });
        } catch (error) {
          Logger.warn('Failed to generate summary, continuing without it', {
            articleId: article.id,
            error: error.message
          });
          // Continue without summary if generation fails
        }
      }

      // Check if article needs chunking (title + content > 8000 chars)
      const fullText = `${article.title}\n\n${article.content}`;
      const needsChunking = fullText.length > 8000;

      if (needsChunking) {
        Logger.info('Article exceeds 8000 characters, using chunking', {
          articleId: article.id,
          totalLength: fullText.length
        });

        // Generate chunked embeddings
        const chunkResult = await this.embeddingService.generateChunkedEmbeddings(
          article.title,
          article.content
        );
        const chunks = chunkResult.chunks;
        const embeddingTokens = chunkResult.totalTokens;

        // Store article without embedding (chunks will be stored separately)
        // Pass null/empty array to indicate no embedding (article uses chunks)
        const stored = await this.repository.store(article, null);
        
        // Store chunks
        await this.repository.storeChunks(article.id, chunks);

        const duration = Date.now() - startTime;
        Logger.success('Article stored with chunks', {
          articleId: article.id,
          chunkCount: chunks.length,
          duration: `${duration}ms`,
          embeddingTokens: embeddingTokens,
          summaryTokens: summaryTokens
        });

        return { 
          stored: true, 
          article: stored, 
          chunked: true, 
          chunkCount: chunks.length,
          tokens: {
            summary: summaryTokens,
            embedding: embeddingTokens,
            total: summaryTokens + embeddingTokens
          }
        };
      } else {
        // Generate single embedding for article (title + content)
        const embeddingResult = await this.embeddingService.generateArticleEmbedding(
          article.title,
          article.content
        );
        const embedding = embeddingResult.embedding;
        const embeddingTokens = embeddingResult.tokens;

        Logger.debug('Storing article in database', { articleId: article.id });

        // Store article with embedding
        const stored = await this.repository.store(article, embedding);
      
        const duration = Date.now() - startTime;
        Logger.success('Article stored successfully', {
          articleId: article.id,
          duration: `${duration}ms`,
          embeddingTokens: embeddingTokens,
          summaryTokens: summaryTokens
        });

        return { 
          stored: true, 
          article: stored, 
          chunked: false,
          tokens: {
            summary: summaryTokens,
            embedding: embeddingTokens,
            total: summaryTokens + embeddingTokens
          }
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Failed to store article', {
        articleId: article.id,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Stores multiple articles
   * @param {Article[]} articles - Articles to store
   * @returns {Promise<{stored: number, skipped: number}>}
   */
  async storeArticles(articles) {
    const total = articles.length;
    Logger.info('Starting batch article storage', { total });

    let stored = 0;
    let skipped = 0;
    let failed = 0;
    let totalSummaryTokens = 0;
    let totalEmbeddingTokens = 0;

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      Logger.step(i + 1, total, `Processing: ${article.title.substring(0, 50)}...`);

      try {
        const result = await this.storeArticle(article);
        if (result.stored) {
          stored++;
          if (result.tokens) {
            totalSummaryTokens += result.tokens.summary || 0;
            totalEmbeddingTokens += result.tokens.embedding || 0;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        Logger.error('Failed to store article in batch', {
          articleId: article.id,
          error: error.message
        });
        skipped++;
        failed++;
      }
    }

    const totalTokens = totalSummaryTokens + totalEmbeddingTokens;

    Logger.success('Batch storage completed', {
      total,
      stored,
      skipped,
      failed,
      tokens: {
        summary: totalSummaryTokens,
        embedding: totalEmbeddingTokens,
        total: totalTokens
      }
    });

    return { 
      stored, 
      skipped,
      tokens: {
        summary: totalSummaryTokens,
        embedding: totalEmbeddingTokens,
        total: totalTokens
      }
    };
  }
}

