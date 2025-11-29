/**
 * Reset Database Script
 * 
 * WARNING: This will DELETE ALL data from the database!
 * 
 * This script:
 * 1. Drops all tables (articles, article_chunks)
 * 2. Recreates the schema with fresh structure
 * 3. Ready for new data with correct article_id format
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { DatabaseClient } from '../src/database/DatabaseClient.js';
import { Logger } from '../src/utils/Logger.js';

dotenv.config();

const { Pool } = pg;

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    Logger.warn('⚠️  WARNING: This will DELETE ALL data from the database!');
    Logger.info('Starting database reset...');

    // Step 1: Drop tables (CASCADE will also drop article_chunks)
    Logger.info('Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS article_chunks CASCADE;');
    await pool.query('DROP TABLE IF EXISTS articles CASCADE;');
    
    Logger.success('Tables dropped successfully');

    // Step 2: Reinitialize schema using DatabaseClient
    Logger.info('Recreating database schema...');
    const dbClient = new DatabaseClient(process.env.DATABASE_URL);
    await dbClient.initialize();
    
    Logger.success('Database schema recreated successfully');
    Logger.success('✅ Database reset complete! Ready for new data with correct article_id format.');

  } catch (error) {
    Logger.error('Database reset failed', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    await pool.end();
  }
}

// Run reset
resetDatabase()
  .then(() => {
    Logger.success('Reset script completed');
    process.exit(0);
  })
  .catch((error) => {
    Logger.error('Reset script failed', { error: error.message });
    process.exit(1);
  });

