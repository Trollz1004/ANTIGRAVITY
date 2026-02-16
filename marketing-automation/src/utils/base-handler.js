/**
 * Base Platform Handler
 * Opus Platform - Production Grade
 *
 * All platform handlers extend this class for consistent behavior
 */

const logger = require('../logger');
const rateLimiter = require('./rate-limiter');
const { withRetry, CircuitBreaker } = require('./retry');
const { withErrorHandling, PlatformError } = require('./error-handler');
const { validateContent, validateEnvVars, sanitizeContent, validateTaggingRules } = require('./validation');

class BasePlatformHandler {
  constructor(platformName, requiredEnvVars = []) {
    this.platform = platformName;
    this.requiredEnvVars = requiredEnvVars;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeMs: 60000
    });
    this.authenticated = false;
    this.lastHealthCheck = null;

    // Validate environment on construction
    this.validateEnvironment();
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    try {
      validateEnvVars(this.platform, this.requiredEnvVars);
      return true;
    } catch (error) {
      logger.warn(`${this.platform}: Missing env vars - ${error.message}`);
      return false;
    }
  }

  /**
   * Check if handler is ready to use
   */
  isReady() {
    return this.validateEnvironment();
  }

  /**
   * Authenticate with the platform (override in subclass)
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by subclass');
  }

  /**
   * Post content to platform (override in subclass)
   */
  async _post(content) {
    throw new Error('_post() must be implemented by subclass');
  }

  /**
   * Get analytics for a post (override in subclass)
   */
  async _getAnalytics(postId) {
    throw new Error('_getAnalytics() must be implemented by subclass');
  }

  /**
   * Health check (override in subclass for platform-specific check)
   */
  async healthCheck() {
    return {
      platform: this.platform,
      ready: this.isReady(),
      authenticated: this.authenticated,
      circuitBreaker: this.circuitBreaker.getState()
    };
  }

  /**
   * Post with full error handling, rate limiting, and retry
   */
  async post(content) {
    // Validate content
    const sanitized = sanitizeContent(content);
    validateContent(this.platform, sanitized);

    // Check tagging rules (warn but don't block)
    try {
      validateTaggingRules(this.platform, sanitized);
    } catch (error) {
      logger.warn(`${this.platform}: Tagging rule violation - ${error.message}`);
    }

    // Execute with all protections
    return withErrorHandling(this.platform, 'post', async () => {
      return this.circuitBreaker.execute(async () => {
        return rateLimiter.execute(this.platform, async () => {
          return withRetry(
            async () => {
              // Ensure authenticated
              if (!this.authenticated) {
                await this.authenticate();
              }
              return this._post(sanitized);
            },
            {
              maxRetries: 3,
              baseDelayMs: 1000,
              shouldRetry: (error) => {
                // Don't retry auth errors
                if (error.statusCode === 401 || error.statusCode === 403) {
                  this.authenticated = false;
                  return false;
                }
                return error.retryable !== false;
              }
            }
          );
        });
      });
    }, { content: sanitized.substring(0, 100) + '...' });
  }

  /**
   * Get analytics with error handling
   */
  async getAnalytics(postId) {
    if (!postId) {
      throw new PlatformError(this.platform, 'getAnalytics', new Error('postId is required'));
    }

    return withErrorHandling(this.platform, 'getAnalytics', async () => {
      return rateLimiter.execute(this.platform, async () => {
        return withRetry(
          async () => this._getAnalytics(postId),
          { maxRetries: 2, baseDelayMs: 500 }
        );
      });
    }, { postId });
  }

  /**
   * Create axios config with timeout and proper headers
   */
  getAxiosConfig(additionalHeaders = {}) {
    return {
      timeout: 30000,
      headers: {
        'User-Agent': 'OpusPlatform/1.0 (Marketing Engine)',
        ...additionalHeaders
      }
    };
  }

  /**
   * Safe response data extraction
   */
  extractResponseData(response, path, defaultValue = null) {
    const parts = path.split('.');
    let value = response;

    for (const part of parts) {
      if (value === null || value === undefined) return defaultValue;
      value = value[part];
    }

    return value !== undefined ? value : defaultValue;
  }
}

module.exports = BasePlatformHandler;
