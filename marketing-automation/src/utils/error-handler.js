/**
 * Centralized Error Handler for Marketing Engine
 * Opus Platform - Production Grade
 */

const logger = require('../logger');

class PlatformError extends Error {
  constructor(platform, operation, originalError, context = {}) {
    super(`[${platform}] ${operation} failed: ${originalError.message}`);
    this.name = 'PlatformError';
    this.platform = platform;
    this.operation = operation;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.retryable = this.isRetryable(originalError);
    this.statusCode = originalError.response?.status || null;
  }

  isRetryable(error) {
    const status = error.response?.status;
    // Retry on: network errors, rate limits, server errors
    if (!status) return true; // Network error
    if (status === 429) return true; // Rate limited
    if (status >= 500) return true; // Server error
    if (status === 408) return true; // Timeout
    return false;
  }
}

class RateLimitError extends PlatformError {
  constructor(platform, retryAfter = 60) {
    super(platform, 'rate_limit', new Error('Rate limit exceeded'));
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.retryable = true;
  }
}

class AuthenticationError extends PlatformError {
  constructor(platform, message = 'Authentication failed') {
    super(platform, 'authentication', new Error(message));
    this.name = 'AuthenticationError';
    this.retryable = false;
  }
}

class ValidationError extends PlatformError {
  constructor(platform, message, field = null) {
    super(platform, 'validation', new Error(message));
    this.name = 'ValidationError';
    this.field = field;
    this.retryable = false;
  }
}

/**
 * Wrap async platform operations with standardized error handling
 */
async function withErrorHandling(platform, operation, fn, context = {}) {
  try {
    return await fn();
  } catch (error) {
    const platformError = error instanceof PlatformError
      ? error
      : new PlatformError(platform, operation, error, context);

    logger.error(`Platform error: ${platformError.message}`, {
      platform: platformError.platform,
      operation: platformError.operation,
      statusCode: platformError.statusCode,
      retryable: platformError.retryable,
      context: platformError.context,
      stack: error.stack
    });

    throw platformError;
  }
}

/**
 * Parse rate limit headers from response
 */
function parseRateLimitHeaders(headers) {
  return {
    limit: parseInt(headers['x-rate-limit-limit'] || headers['x-ratelimit-limit'] || 0),
    remaining: parseInt(headers['x-rate-limit-remaining'] || headers['x-ratelimit-remaining'] || 0),
    reset: parseInt(headers['x-rate-limit-reset'] || headers['x-ratelimit-reset'] || 0),
    retryAfter: parseInt(headers['retry-after'] || 0)
  };
}

/**
 * Check if response indicates rate limiting
 */
function isRateLimited(response) {
  if (response.status === 429) return true;
  const headers = parseRateLimitHeaders(response.headers || {});
  return headers.remaining === 0;
}

module.exports = {
  PlatformError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  withErrorHandling,
  parseRateLimitHeaders,
  isRateLimited
};
