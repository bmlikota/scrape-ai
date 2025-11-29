import { DatabaseClient } from '../database/DatabaseClient.js';
import { Logger } from '../utils/Logger.js';

/**
 * ArticleRepository
 * Single Responsibility: Database operations for articles
 * Follows Repository Pattern
 */
export class ArticleRepository {
  constructor(databaseClient) {
    this.db = databaseClient;
  }

  /**
   * Checks if article exists by article_id
   * @param {string} articleId - Article ID
   * @returns {Promise<boolean>}
   */
  async exists(articleId) {
    const result = await this.db.query(
      'SELECT 1 FROM articles WHERE article_id = $1 LIMIT 1',
      [articleId]
    );
    const exists = result.rows.length > 0;
    Logger.debug('Article existence check', { articleId, exists });
    return exists;
  }

  /**
   * Stores article with embedding
   * @param {Object} article - Article object
   * @param {number[]} embedding - Vector embedding
   * @returns {Promise<Object>} Stored article
   */
  async store(article, embedding) {
    const startTime = Date.now();
    const {
      id: articleId,
      title,
      link,
      description,
      content,
      pubDate,
      author,
      source,
      score = 0,
      comments = 0
    } = article;

    Logger.debug('Storing article in database', {
      articleId,
      titleLength: title?.length || 0,
      contentLength: content?.length || 0,
      embeddingDimensions: embedding?.length || 0
    });

    try {
      // Handle NULL embedding for chunked articles
      const embeddingValue = embedding && embedding.length > 0 
        ? `[${embedding.join(',')}]` 
        : null;

      const result = await this.db.query(`
        INSERT INTO articles (
          article_id, title, link, description, content, 
          pub_date, author, source, score, comments, embedding
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (article_id) 
        DO UPDATE SET
          title = EXCLUDED.title,
          link = EXCLUDED.link,
          description = EXCLUDED.description,
          content = EXCLUDED.content,
          pub_date = EXCLUDED.pub_date,
          author = EXCLUDED.author,
          source = EXCLUDED.source,
          score = EXCLUDED.score,
          comments = EXCLUDED.comments,
          embedding = EXCLUDED.embedding,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        articleId,
        title,
        link,
        description || '',
        content,
        new Date(pubDate),
        author || '',
        source,
        score,
        comments,
        embeddingValue
      ]);

      const duration = Date.now() - startTime;
      
      // Better way to detect INSERT vs UPDATE: check if created_at equals updated_at
      // On INSERT: both timestamps are set to CURRENT_TIMESTAMP (equal)
      // On UPDATE: updated_at is set to CURRENT_TIMESTAMP, created_at stays old (different)
      const row = result.rows[0];
      const createdAt = new Date(row.created_at).getTime();
      const updatedAt = new Date(row.updated_at).getTime();
      // Allow 1 second tolerance for timestamp precision
      const isUpdate = Math.abs(updatedAt - createdAt) > 1000;
      
      Logger.success('Article stored in database', {
        articleId,
        operation: isUpdate ? 'UPDATED' : 'INSERTED',
        duration: `${duration}ms`,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });

      return result.rows[0];
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Failed to store article in database', {
        articleId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Finds articles by vector similarity (semantic search)
   * @param {number[]} queryEmbedding - Query vector embedding
   * @param {number} limit - Maximum number of results
   * @param {number} similarityThreshold - Minimum similarity (0-1)
   * @returns {Promise<Array>} Similar articles ordered by relevance
   */
  async findBySimilarity(queryEmbedding, limit = 10, similarityThreshold = 0.7) {
    const startTime = Date.now();
    
    Logger.debug('Executing vector similarity search', {
      embeddingDimensions: queryEmbedding.length,
      limit,
      similarityThreshold
    });

    try {
      // Cosine similarity: 1 - (embedding <=> query_embedding)
      // Higher value = more similar
      const result = await this.db.query(`
        SELECT 
          article_id,
          title,
          link,
          description,
          content,
          pub_date,
          author,
          source,
          score,
          comments,
          1 - (embedding <=> $1::vector) AS similarity
        FROM articles
        WHERE embedding IS NOT NULL
          AND 1 - (embedding <=> $1::vector) >= $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `, [
        `[${queryEmbedding.join(',')}]`,
        similarityThreshold,
        limit
      ]);

      const duration = Date.now() - startTime;
      const articles = result.rows.map(row => ({
        articleId: row.article_id,
        title: row.title,
        link: row.link,
        description: row.description,
        content: row.content,
        pubDate: row.pub_date,
        author: row.author,
        source: row.source,
        score: row.score,
        comments: row.comments,
        similarity: parseFloat(row.similarity)
      }));

      Logger.success('Vector similarity search completed', {
        resultsFound: articles.length,
        duration: `${duration}ms`,
        avgSimilarity: articles.length > 0
          ? (articles.reduce((sum, a) => sum + a.similarity, 0) / articles.length).toFixed(3)
          : 0
      });

      return articles;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Vector similarity search failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Finds articles by their IDs
   * @param {string[]} articleIds - Array of article IDs
   * @returns {Promise<Array>} Articles
   */
  async findByIds(articleIds) {
    if (articleIds.length === 0) {
      return [];
    }

    const placeholders = articleIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.db.query(
      `SELECT * FROM articles WHERE article_id IN (${placeholders})`,
      articleIds
    );

    return result.rows.map(row => ({
      articleId: row.article_id,
      title: row.title,
      link: row.link,
      description: row.description,
      content: row.content,
      pubDate: row.pub_date,
      author: row.author,
      source: row.source,
      score: row.score,
      comments: row.comments
    }));
  }

  /**
   * Stores article chunks with embeddings
   * @param {string} articleId - Article ID
   * @param {Array<{chunkIndex: number, chunkText: string, embedding: number[]}>} chunks - Chunks with embeddings
   * @returns {Promise<void>}
   */
  async storeChunks(articleId, chunks) {
    const startTime = Date.now();
    
    Logger.debug('Storing article chunks', {
      articleId,
      chunkCount: chunks.length
    });

    try {
      // Delete existing chunks for this article (in case of update)
      await this.db.query(
        'DELETE FROM article_chunks WHERE article_id = $1',
        [articleId]
      );

      // Insert all chunks in a transaction
      for (const chunk of chunks) {
        await this.db.query(`
          INSERT INTO article_chunks (
            article_id, chunk_index, chunk_text, embedding
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (article_id, chunk_index)
          DO UPDATE SET
            chunk_text = EXCLUDED.chunk_text,
            embedding = EXCLUDED.embedding
        `, [
          articleId,
          chunk.chunkIndex,
          chunk.chunkText,
          `[${chunk.embedding.join(',')}]`
        ]);
      }

      const duration = Date.now() - startTime;
      Logger.success('Article chunks stored', {
        articleId,
        chunkCount: chunks.length,
        duration: `${duration}ms`
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Failed to store article chunks', {
        articleId,
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Finds articles by vector similarity using both articles and chunks
   * Groups results by article_id and returns the best match per article
   * @param {number[]} queryEmbedding - Query vector embedding
   * @param {number} limit - Maximum number of results
   * @param {number} similarityThreshold - Minimum similarity (0-1)
   * @returns {Promise<Array>} Similar articles ordered by relevance
   */
  async findBySimilarityWithChunks(queryEmbedding, limit = 10, similarityThreshold = 0.7) {
    const startTime = Date.now();
    
    Logger.debug('Executing vector similarity search with chunks', {
      embeddingDimensions: queryEmbedding.length,
      limit,
      similarityThreshold
    });

    try {
      // Search both articles table and chunks table
      // Use UNION ALL to combine results, then group by article_id
      // Return the best similarity score per article
      const result = await this.db.query(`
        WITH all_matches AS (
          -- Search in articles table (for articles without chunks)
          SELECT 
            a.article_id,
            a.title,
            a.link,
            a.description,
            a.content,
            a.pub_date,
            a.author,
            a.source,
            a.score,
            a.comments,
            1 - (a.embedding <=> $1::vector) AS similarity,
            NULL::INTEGER AS chunk_index,
            NULL::TEXT AS chunk_text
          FROM articles a
          WHERE a.embedding IS NOT NULL
            AND 1 - (a.embedding <=> $1::vector) >= $2
          
          UNION ALL
          
          -- Search in chunks table (for chunked articles)
          SELECT 
            a.article_id,
            a.title,
            a.link,
            a.description,
            a.content,
            a.pub_date,
            a.author,
            a.source,
            a.score,
            a.comments,
            1 - (c.embedding <=> $1::vector) AS similarity,
            c.chunk_index,
            c.chunk_text
          FROM article_chunks c
          JOIN articles a ON a.article_id = c.article_id
          WHERE 1 - (c.embedding <=> $1::vector) >= $2
        ),
        best_matches AS (
          SELECT DISTINCT ON (article_id)
            article_id,
            title,
            link,
            description,
            content,
            pub_date,
            author,
            source,
            score,
            comments,
            similarity,
            chunk_index,
            chunk_text
          FROM all_matches
          ORDER BY article_id, similarity DESC
        )
        SELECT *
        FROM best_matches
        ORDER BY similarity DESC
        LIMIT $3
      `, [
        `[${queryEmbedding.join(',')}]`,
        similarityThreshold,
        limit
      ]);

      const duration = Date.now() - startTime;
      const articles = result.rows.map(row => ({
        articleId: row.article_id,
        title: row.title,
        link: row.link,
        description: row.description,
        content: row.content,
        pubDate: row.pub_date,
        author: row.author,
        source: row.source,
        score: row.score,
        comments: row.comments,
        similarity: parseFloat(row.similarity),
        matchedChunkIndex: row.chunk_index,
        matchedChunkText: row.chunk_text
      }));

      Logger.success('Vector similarity search with chunks completed', {
        resultsFound: articles.length,
        duration: `${duration}ms`,
        avgSimilarity: articles.length > 0
          ? (articles.reduce((sum, a) => sum + a.similarity, 0) / articles.length).toFixed(3)
          : 0
      });

      return articles;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Vector similarity search with chunks failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Gets total number of articles in database
   * @returns {Promise<number>}
   */
  async count() {
    const result = await this.db.query('SELECT COUNT(*) as count FROM articles');
    return parseInt(result.rows[0].count, 10);
  }
}

