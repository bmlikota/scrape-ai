import OpenAI from 'openai';
import { Logger } from '../utils/Logger.js';

/**
 * EmbeddingService
 * Single Responsibility: Converting text to vector embeddings
 * Uses OpenAI embeddings API
 */
export class EmbeddingService {
  constructor(apiKey, model = 'text-embedding-3-small', dimensions = 1536) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.dimensions = dimensions;
    
    Logger.info('EmbeddingService initialized', { model, dimensions });
  }

  /**
   * Generates embedding vector for given text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   * @throws {Error} If embedding generation fails
   */
  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const startTime = Date.now();
    const originalLength = text.length;

    try {
      // Truncate text if too long (OpenAI has token limits)
      const maxLength = 8000; // Approximate token limit
      const truncatedText = text.length > maxLength 
        ? text.substring(0, maxLength) 
        : text;

      if (text.length > maxLength) {
        Logger.warn('Text truncated for embedding', { 
          originalLength, 
          truncatedLength: truncatedText.length 
        });
      }

      Logger.debug('Generating embedding', { 
        textLength: truncatedText.length,
        model: this.model 
      });

      const response = await this.client.embeddings.create({
        model: this.model,
        input: truncatedText,
        dimensions: this.dimensions,
      });

      const duration = Date.now() - startTime;
      const embedding = response.data[0].embedding;

      Logger.success('Embedding generated', { 
        dimensions: embedding.length,
        duration: `${duration}ms`,
        tokens: response.usage?.total_tokens 
      });

      return embedding;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Failed to generate embedding', { 
        error: error.message,
        duration: `${duration}ms`,
        textLength: originalLength 
      });
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generates embedding for article content
   * Combines title and content for better semantic representation
   * @param {string} title - Article title
   * @param {string} content - Article content
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateArticleEmbedding(title, content) {
    Logger.info('Generating article embedding', { 
      titleLength: title?.length || 0,
      contentLength: content?.length || 0 
    });

    // Combine title and content for better semantic search
    // Title is often more descriptive than content snippets
    const textToEmbed = `${title}\n\n${content}`;
    return this.generateEmbedding(textToEmbed);
  }

  /**
   * Splits text into chunks for embedding
   * Uses overlapping chunks to preserve context
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Maximum characters per chunk (default: 8000)
   * @param {number} overlap - Overlap between chunks in characters (default: 200)
   * @returns {string[]} Array of text chunks
   */
  splitIntoChunks(text, chunkSize = 8000, overlap = 200) {
    if (!text || text.length <= chunkSize) {
      return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // If not the last chunk, try to break at a sentence boundary
      if (end < text.length) {
        // Look for sentence endings within the last 500 characters
        const searchStart = Math.max(end - 500, start);
        const searchText = text.substring(searchStart, end);
        const lastPeriod = searchText.lastIndexOf('. ');
        const lastNewline = searchText.lastIndexOf('\n\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > 0) {
          end = searchStart + breakPoint + (lastPeriod > lastNewline ? 2 : 2);
        }
      }

      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start position forward, accounting for overlap
      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }

  /**
   * Generates chunked embeddings for long articles
   * Splits article into chunks and generates embedding for each chunk
   * @param {string} title - Article title
   * @param {string} content - Article content
   * @param {number} chunkSize - Maximum characters per chunk (default: 8000)
   * @param {number} overlap - Overlap between chunks (default: 200)
   * @returns {Promise<Array<{chunkIndex: number, chunkText: string, embedding: number[]}>>}
   */
  async generateChunkedEmbeddings(title, content, chunkSize = 8000, overlap = 200) {
    const startTime = Date.now();
    const fullText = `${title}\n\n${content}`;
    const originalLength = fullText.length;

    Logger.info('Generating chunked embeddings', {
      titleLength: title?.length || 0,
      contentLength: content?.length || 0,
      totalLength: originalLength,
      chunkSize,
      overlap
    });

    // Split into chunks
    const chunks = this.splitIntoChunks(fullText, chunkSize, overlap);

    if (chunks.length === 1) {
      // Article fits in one chunk, use single embedding
      Logger.debug('Article fits in single chunk, using standard embedding');
      const embedding = await this.generateEmbedding(fullText);
      return [{
        chunkIndex: 0,
        chunkText: fullText,
        embedding
      }];
    }

    Logger.info('Article split into chunks', {
      totalChunks: chunks.length,
      avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.length, 0) / chunks.length)
    });

    // Generate embeddings for each chunk in parallel
    const embeddingPromises = chunks.map(async (chunk, index) => {
      const embedding = await this.generateEmbedding(chunk);
      return {
        chunkIndex: index,
        chunkText: chunk,
        embedding
      };
    });

    const results = await Promise.all(embeddingPromises);

    const duration = Date.now() - startTime;
    Logger.success('Chunked embeddings generated', {
      totalChunks: results.length,
      totalTokens: results.reduce((sum, r) => sum + r.chunkText.length, 0),
      duration: `${duration}ms`,
      avgTimePerChunk: `${Math.round(duration / results.length)}ms`
    });

    return results;
  }
}

