import OpenAI from 'openai';
import { Logger } from '../utils/Logger.js';

/**
 * Service for generating article summaries using OpenAI
 */
export class SummarizationService {
  constructor(apiKey, model = 'gpt-4o-mini') {
    if (!apiKey) {
      throw new Error('OpenAI API key is required for summarization');
    }

    this.client = new OpenAI({ apiKey });
    this.model = model;

    Logger.info('SummarizationService initialized', { model });
  }

  /**
   * Generates a 4-sentence summary of an article
   * @param {string} title - Article title
   * @param {string} content - Article content
   * @returns {Promise<string>} Summary (4 sentences)
   */
  async generateSummary(title, content) {
    const startTime = Date.now();

    if (!title || !content || content.trim().length < 100) {
      Logger.warn('Insufficient content for summarization', {
        titleLength: title?.length || 0,
        contentLength: content?.length || 0
      });
      return '';
    }

    try {
      Logger.debug('Generating article summary', {
        titleLength: title.length,
        contentLength: content.length
      });

      // Truncate content if too long (to save tokens)
      const maxContentLength = 8000;
      const truncatedContent = content.length > maxContentLength
        ? content.substring(0, maxContentLength) + '...'
        : content;

      const prompt = `Summarize the following cybersecurity article in exactly 4 sentences. Focus on the key points, threats, vulnerabilities, or important information. Be concise and informative.

Title: ${title}

Content:
${truncatedContent}

Summary (4 sentences):`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity news summarizer. Create concise, informative 4-sentence summaries that help readers quickly understand the key points of cybersecurity articles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent summaries
        max_tokens: 200 // Limit to ensure 4 sentences
      });

      const summary = response.choices[0]?.message?.content?.trim() || '';
      const duration = Date.now() - startTime;
      const tokens = response.usage?.total_tokens || 0;

      if (summary) {
        Logger.success('Summary generated successfully', {
          summaryLength: summary.length,
          duration: `${duration}ms`,
          tokens: tokens
        });
      } else {
        Logger.warn('Empty summary generated', { duration: `${duration}ms` });
      }

      return { summary, tokens };
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Failed to generate summary', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }
}

