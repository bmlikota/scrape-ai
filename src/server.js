import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createArticleRoutes } from './routes/articleRoutes.js';
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
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Configures Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  /**
   * Configures application routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });

    // Article routes
    this.app.use('/api/articles', createArticleRoutes());
  }

  /**
   * Starts the server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server running on http://localhost:${this.port}`);
      console.log(`📰 Articles endpoint: http://localhost:${this.port}/api/articles`);
      console.log(`❤️  Health check: http://localhost:${this.port}/health`);
    });
  }
}

// Start server
const server = new Server();
server.start();
