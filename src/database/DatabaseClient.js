import pg from 'pg';
const { Pool } = pg;
import { Logger } from '../utils/Logger.js';

/**
 * DatabaseClient
 * Single Responsibility: Database connection and query execution
 * Manages PostgreSQL connection pool
 */
export class DatabaseClient {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString: connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      Logger.error('Database pool error', { error: err.message });
    });

    Logger.info('Database connection pool created');
  }

  /**
   * Executes a query
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Only log slow queries or important operations
      if (duration > 100 || text.includes('INSERT') || text.includes('SELECT') && text.includes('similarity')) {
        Logger.debug('Database query executed', {
          operation: text.split(' ')[0],
          duration: `${duration}ms`,
          rows: res.rowCount
        });
      }
      
      return res;
    } catch (error) {
      const duration = Date.now() - start;
      Logger.error('Database query failed', {
        error: error.message,
        query: text.substring(0, 100),
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Initializes the database schema
   * Creates tables and extensions if they don't exist
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Enable pgvector extension
      await this.query('CREATE EXTENSION IF NOT EXISTS vector;');

      // Create articles table with vector column
      // embedding can be NULL for chunked articles (they use article_chunks table)
      await this.query(`
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          article_id VARCHAR(255) UNIQUE NOT NULL,
          title TEXT NOT NULL,
          link TEXT NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          pub_date TIMESTAMP NOT NULL,
          author VARCHAR(255),
          source VARCHAR(100) NOT NULL,
          score INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          embedding vector(1536),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create index for vector similarity search (HNSW for fast approximate search)
      await this.query(`
        CREATE INDEX IF NOT EXISTS articles_embedding_idx 
        ON articles 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
      `);

      // Create index for article_id lookups
      await this.query(`
        CREATE INDEX IF NOT EXISTS articles_article_id_idx 
        ON articles (article_id);
      `);

      // Create index for source and date filtering
      await this.query(`
        CREATE INDEX IF NOT EXISTS articles_source_date_idx 
        ON articles (source, pub_date DESC);
      `);

      // Create article_chunks table for chunked embeddings
      await this.query(`
        CREATE TABLE IF NOT EXISTS article_chunks (
          id SERIAL PRIMARY KEY,
          article_id VARCHAR(255) NOT NULL,
          chunk_index INTEGER NOT NULL,
          chunk_text TEXT NOT NULL,
          embedding vector(1536) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(article_id, chunk_index)
        );
      `);
      
      // Add foreign key constraint separately (after table creation)
      // This allows us to handle the case where chunks might be created before article exists
      await this.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'article_chunks_article_id_fkey'
          ) THEN
            ALTER TABLE article_chunks
            ADD CONSTRAINT article_chunks_article_id_fkey
            FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE;
          END IF;
        END $$;
      `);

      // Create index for chunk similarity search
      await this.query(`
        CREATE INDEX IF NOT EXISTS article_chunks_embedding_idx 
        ON article_chunks 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
      `);

      // Create index for article_id lookups in chunks
      await this.query(`
        CREATE INDEX IF NOT EXISTS article_chunks_article_id_idx 
        ON article_chunks (article_id);
      `);

      Logger.success('Database initialized successfully', {
        tables: ['articles', 'article_chunks'],
        indexes: [
          'articles_embedding_idx', 
          'articles_article_id_idx', 
          'articles_source_date_idx',
          'article_chunks_embedding_idx',
          'article_chunks_article_id_idx'
        ]
      });
    } catch (error) {
      Logger.error('Database initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Closes the database connection pool
   * @returns {Promise<void>}
   */
  async close() {
    await this.pool.end();
  }
}

