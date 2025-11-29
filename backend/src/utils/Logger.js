/**
 * Logger
 * Single Responsibility: Centralized logging utility
 * Provides structured logging with timestamps and log levels
 */
export class Logger {
  /**
   * Formats log message with timestamp
   * @param {string} level - Log level (INFO, ERROR, WARN, DEBUG)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   * @returns {string} Formatted log message
   */
  static formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelEmoji = {
      INFO: 'ℹ️',
      ERROR: '❌',
      WARN: '⚠️',
      DEBUG: '🔍',
      SUCCESS: '✅'
    };

    let logMessage = `[${timestamp}] ${levelEmoji[level] || '📝'} [${level}] ${message}`;
    
    if (data) {
      logMessage += `\n   Data: ${JSON.stringify(data, null, 2)}`;
    }

    return logMessage;
  }

  /**
   * Logs info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static info(message, data = null) {
    console.log(this.formatMessage('INFO', message, data));
  }

  /**
   * Logs error message
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or additional data
   */
  static error(message, error = null) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage('ERROR', message, errorData));
  }

  /**
   * Logs warning message
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   */
  static warn(message, data = null) {
    console.warn(this.formatMessage('WARN', message, data));
  }

  /**
   * Logs debug message
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   */
  static debug(message, data = null) {
    console.log(this.formatMessage('DEBUG', message, data));
  }

  /**
   * Logs success message
   * @param {string} message - Success message
   * @param {Object} data - Additional data
   */
  static success(message, data = null) {
    console.log(this.formatMessage('SUCCESS', message, data));
  }

  /**
   * Logs step with progress indicator
   * @param {number} step - Step number
   * @param {number} total - Total steps
   * @param {string} message - Step message
   */
  static step(step, total, message) {
    console.log(`[${new Date().toISOString()}] 📋 [STEP ${step}/${total}] ${message}`);
  }
}

