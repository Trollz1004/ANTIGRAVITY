/**
 * Retry Logic with Exponential Backoff
 * Opus Platform - Production Grade
 */

const logger = require('../logger');

const DEFAULT_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  factor: 2,
  jitter: true
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt, options) {
  const { baseDelayMs, maxDelayMs, factor, jitter } = options;

  let delay = baseDelayMs * Math.pow(factor, attempt);
  delay = Math.min(delay, maxDelayMs);

  if (jitter) {
    // Add random jitter of ±25%
    const jitterAmount = delay * 0.25;
    delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
  }

  return Math.floor(delay);
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry(fn, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxRetries, shouldRetry = () => true } = opts;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = error.retryable !== false && shouldRetry(error, attempt);

      if (attempt >= maxRetries || !isRetryable) {
        logger.error(`Retry exhausted after ${attempt + 1} attempts`, {
          error: error.message,
          retryable: isRetryable
        });
        throw error;
      }

      const delay = calculateDelay(attempt, opts);

      logger.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`, {
        error: error.message,
        statusCode: error.response?.status || error.statusCode
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry with circuit breaker pattern
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeMs = options.resetTimeMs || 60000;
    this.failures = 0;
    this.lastFailure = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeMs) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker: HALF_OPEN, testing...');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      logger.info('Circuit breaker: CLOSED (recovered)');
    }
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker: OPEN after ${this.failures} failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  withRetry,
  CircuitBreaker,
  calculateDelay,
  DEFAULT_OPTIONS
};
