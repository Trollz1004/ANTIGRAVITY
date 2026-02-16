/**
 * Utils Index - Easy imports
 * Opus Platform - Production Grade
 */

const errorHandler = require('./error-handler');
const rateLimiter = require('./rate-limiter');
const retry = require('./retry');
const validation = require('./validation');
const BasePlatformHandler = require('./base-handler');

module.exports = {
  // Error handling
  PlatformError: errorHandler.PlatformError,
  RateLimitError: errorHandler.RateLimitError,
  AuthenticationError: errorHandler.AuthenticationError,
  ValidationError: errorHandler.ValidationError,
  withErrorHandling: errorHandler.withErrorHandling,
  parseRateLimitHeaders: errorHandler.parseRateLimitHeaders,
  isRateLimited: errorHandler.isRateLimited,

  // Rate limiting
  rateLimiter,

  // Retry logic
  withRetry: retry.withRetry,
  CircuitBreaker: retry.CircuitBreaker,

  // Validation
  validateContent: validation.validateContent,
  validateUrl: validation.validateUrl,
  validateEnvVars: validation.validateEnvVars,
  sanitizeContent: validation.sanitizeContent,
  truncateContent: validation.truncateContent,
  validateHashtags: validation.validateHashtags,
  validateTaggingRules: validation.validateTaggingRules,
  CHAR_LIMITS: validation.CHAR_LIMITS,

  // Base handler
  BasePlatformHandler
};
