/**
 * Migration Script: Convert old article IDs to new format
 * 
 * Old format: hackernews-api-{storyId}-{timestamp}
 * New format: {storyId} (direct API ID)
 * 
 * This script:
 * 1. Extracts story IDs from old article_id format
 * 2. Updates article_id to new format
 * 3. Handles duplicates (keeps newest)
 * 4. Updates article_chunks references
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { Logger } from '../src/utils/Logger.js';

dotenv.config();

const { Pool } = pg;

async function migrateArticleIds() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    Logger.info('Starting article ID migration...');

    // Step 1: Find articles with old ID format
    const oldFormatQuery = `
      SELECT article_id, title, source, created_at
      FROM articles
      WHERE article_id LIKE 'hackernews-api-%'
      ORDER BY created_at DESC
    `;

    const oldArticles = await pool.query(oldFormatQuery);
    Logger.info(`Found ${oldArticles.rows.length} articles with old ID format`);

    if (oldArticles.rows.length === 0) {
      Logger.success('No articles to migrate. Database is already up to date.');
      return;
    }

    // Step 2: Extract story IDs and create mapping
    const idMapping = new Map();
    const duplicates = [];

    for (const article of oldArticles.rows) {
      // Extract story ID from old format: hackernews-api-{storyId}-{timestamp}
      const match = article.article_id.match(/^hackernews-api-(\d+)-/);
      if (match) {
        const storyId = match[1];
        const newId = storyId; // New format is just the story ID

        // Check if we already have this story ID
        if (idMapping.has(newId)) {
          // Duplicate - keep the newer one
          const existing = idMapping.get(newId);
          if (new Date(article.created_at) > new Date(existing.created_at)) {
            duplicates.push(existing.article_id);
            idMapping.set(newId, {
              oldId: article.article_id,
              newId: newId,
              createdAt: article.created_at
            });
          } else {
            duplicates.push(article.article_id);
          }
        } else {
          idMapping.set(newId, {
            oldId: article.article_id,
            newId: newId,
            createdAt: article.created_at
          });
        }
      }
    }

    Logger.info(`Will migrate ${idMapping.size} unique articles`);
    if (duplicates.length > 0) {
      Logger.warn(`Will delete ${duplicates.length} duplicate articles`);
    }

    // Step 3: Update article_chunks first (they reference article_id)
    Logger.info('Updating article_chunks references...');
    for (const [newId, mapping] of idMapping.entries()) {
      await pool.query(
        `UPDATE article_chunks SET article_id = $1 WHERE article_id = $2`,
        [newId, mapping.oldId]
      );
    }

    // Step 4: Delete duplicates
    if (duplicates.length > 0) {
      Logger.info('Deleting duplicate articles...');
      const placeholders = duplicates.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(
        `DELETE FROM articles WHERE article_id IN (${placeholders})`,
        duplicates
      );
    }

    // Step 5: Update article_id to new format
    Logger.info('Updating article_id values...');
    for (const [newId, mapping] of idMapping.entries()) {
      // Temporarily use a placeholder to avoid UNIQUE constraint violation
      const tempId = `__temp_${mapping.oldId}`;
      
      // Step 5a: Rename to temp ID
      await pool.query(
        `UPDATE articles SET article_id = $1 WHERE article_id = $2`,
        [tempId, mapping.oldId]
      );

      // Step 5b: Rename to new ID
      await pool.query(
        `UPDATE articles SET article_id = $1 WHERE article_id = $2`,
        [newId, tempId]
      );
    }

    Logger.success('Migration completed successfully!', {
      migrated: idMapping.size,
      duplicatesRemoved: duplicates.length
    });

    // Step 6: Verify migration
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM articles
      WHERE article_id LIKE 'hackernews-api-%'
    `;
    const verify = await pool.query(verifyQuery);
    
    if (parseInt(verify.rows[0].count, 10) === 0) {
      Logger.success('Verification passed: No articles with old ID format remaining');
    } else {
      Logger.warn('Verification failed: Some articles still have old ID format');
    }

  } catch (error) {
    Logger.error('Migration failed', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateArticleIds()
  .then(() => {
    Logger.success('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    Logger.error('Migration script failed', { error: error.message });
    process.exit(1);
  });

