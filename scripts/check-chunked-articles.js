import dotenv from 'dotenv';
import { DatabaseClient } from '../src/database/DatabaseClient.js';
import { Logger } from '../src/utils/Logger.js';

dotenv.config();

async function checkChunkedArticles() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    Logger.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const dbClient = new DatabaseClient(databaseUrl);

  try {
    // Check articles with NULL embeddings
    const nullEmbeddings = await dbClient.query(`
      SELECT 
        a.article_id,
        a.title,
        LENGTH(a.content) as content_length,
        (SELECT COUNT(*) FROM article_chunks WHERE article_id = a.article_id) as chunk_count
      FROM articles a
      WHERE a.embedding IS NULL
      ORDER BY content_length DESC;
    `);

    Logger.info('Articles with NULL embeddings:', { count: nullEmbeddings.rows.length });

    for (const row of nullEmbeddings.rows) {
      if (row.chunk_count > 0) {
        Logger.success(`✅ Article is CHUNKED (expected)`, {
          articleId: row.article_id,
          title: row.title.substring(0, 60),
          contentLength: row.content_length,
          chunkCount: row.chunk_count
        });
      } else {
        Logger.error(`❌ Article has NO embedding and NO chunks (ERROR!)`, {
          articleId: row.article_id,
          title: row.title.substring(0, 60),
          contentLength: row.content_length
        });
      }
    }

    // Summary
    const summary = await dbClient.query(`
      SELECT 
        COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
        COUNT(*) FILTER (WHERE embedding IS NULL AND 
          (SELECT COUNT(*) FROM article_chunks WHERE article_id = articles.article_id) > 0) as chunked,
        COUNT(*) FILTER (WHERE embedding IS NULL AND 
          (SELECT COUNT(*) FROM article_chunks WHERE article_id = articles.article_id) = 0) as error_no_embedding
      FROM articles;
    `);

    Logger.info('📊 Summary:', {
      withEmbedding: summary.rows[0].with_embedding,
      chunked: summary.rows[0].chunked,
      errorNoEmbedding: summary.rows[0].error_no_embedding
    });

  } catch (error) {
    Logger.error('Failed to check articles', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await dbClient.close();
  }
}

checkChunkedArticles();

