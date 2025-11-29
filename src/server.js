import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createArticleRoutes } from './routes/articleRoutes.js';
import { DatabaseClient } from './database/DatabaseClient.js';
import { ArticleRepository } from './repositories/ArticleRepository.js';
import { EmbeddingService } from './services/EmbeddingService.js';
import { Logger } from './utils/Logger.js';
import { DEFAULT_PORT } from './config/constants.js';

dotenv.config();

/**
 * Application Server
 * Single Responsibility: Server setup and configuration
 * Separates server concerns from business logic
 */
class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || DEFAULT_PORT;
    this.databaseClient = null;
  }

  /**
   * Configures Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' })); // Increase limit for article content
  }

  /**
   * Initializes database and services
   */
  async initializeServices() {
    try {
      // Initialize database connection
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      this.databaseClient = new DatabaseClient(databaseUrl);
      await this.databaseClient.initialize();

      // Initialize repository
      const articleRepository = new ArticleRepository(this.databaseClient);
      this.app.locals.articleRepository = articleRepository;

      // Initialize embedding service
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        Logger.warn('OpenAI API key not set - semantic search will not work');
      } else {
        const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
        const embeddingDimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10);
        const embeddingService = new EmbeddingService(openaiApiKey, embeddingModel, embeddingDimensions);
        this.app.locals.embeddingService = embeddingService;
        Logger.success('Embedding service initialized', { 
          model: embeddingModel, 
          dimensions: embeddingDimensions 
        });
      }

      Logger.success('All services initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize services', { error: error.message });
      throw error;
    }
  }

  /**
   * Configures application routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: this.databaseClient ? 'connected' : 'disconnected'
      });
    });

    // Article routes
    this.app.use('/api/articles', createArticleRoutes());
  }

  /**
   * Starts the server
   */
  async start() {
    try {
      await this.initializeServices();
      this.setupRoutes();

      this.app.listen(this.port, () => {
        Logger.success('Server started successfully', {
          port: this.port,
          endpoints: {
            articles: `http://localhost:${this.port}/api/articles`,
            search: `http://localhost:${this.port}/api/articles/search`,
            store: `http://localhost:${this.port}/api/articles/store`,
            fetchAndStore: `http://localhost:${this.port}/api/articles/fetch-and-store`,
            health: `http://localhost:${this.port}/health`
          }
        });
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down server...');
    if (this.databaseClient) {
      await this.databaseClient.close();
    }
    process.exit(0);
  }
}

// Start server
const server = new Server();
server.start();

// Handle graceful shutdown
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());
