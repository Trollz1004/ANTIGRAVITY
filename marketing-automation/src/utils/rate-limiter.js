/**
 * Rate Limiter with Queue System
 * Opus Platform - Production Grade
 *
 * Implements token bucket algorithm with per-platform limits
 */

const logger = require('../logger');

class RateLimiter {
  constructor() {
    // Platform-specific rate limits (requests per window)
    this.limits = {
      twitter: { requests: 50, windowMs: 15 * 60 * 1000 },      // 50/15min (conservative)
      linkedin: { requests: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100/day
      facebook: { requests: 200, windowMs: 60 * 60 * 1000 },    // 200/hour
      reddit: { requests: 60, windowMs: 60 * 1000 },            // 60/min
      discord: { requests: 5, windowMs: 5 * 1000 },             // 5/5sec (webhook)
      telegram: { requests: 30, windowMs: 1000 },               // 30/sec
      bluesky: { requests: 100, windowMs: 60 * 1000 },          // 100/min
      mastodon: { requests: 300, windowMs: 5 * 60 * 1000 },     // 300/5min
      medium: { requests: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100/day
      devto: { requests: 30, windowMs: 30 * 1000 },             // 30/30sec
      pinterest: { requests: 1000, windowMs: 60 * 60 * 1000 },  // 1000/hour
      producthunt: { requests: 450, windowMs: 15 * 60 * 1000 }, // 450/15min
      hashnode: { requests: 100, windowMs: 60 * 1000 },         // 100/min
      threads: { requests: 25, windowMs: 24 * 60 * 60 * 1000 }, // 25/day (strict)
      youtube: { requests: 10000, windowMs: 24 * 60 * 60 * 1000 }, // 10k/day quota
      tiktok: { requests: 100, windowMs: 60 * 1000 },           // 100/min
      default: { requests: 60, windowMs: 60 * 1000 }            // Default: 60/min
    };

    // Track requests per platform
    this.buckets = {};

    // Request queue per platform
    this.queues = {};

    // Processing flags
    this.processing = {};
  }

  /**
   * Get or create bucket for platform
   */
  getBucket(platform) {
    if (!this.buckets[platform]) {
      const limit = this.limits[platform] || this.limits.default;
      this.buckets[platform] = {
        tokens: limit.requests,
        lastRefill: Date.now(),
        ...limit
      };
    }
    return this.buckets[platform];
  }

  /**
   * Refill tokens based on time elapsed
   */
  refillBucket(platform) {
    const bucket = this.getBucket(platform);
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed >= bucket.windowMs) {
      bucket.tokens = bucket.requests;
      bucket.lastRefill = now;
    } else {
      // Partial refill based on elapsed time
      const refillRate = bucket.requests / bucket.windowMs;
      const tokensToAdd = Math.floor(elapsed * refillRate);
      bucket.tokens = Math.min(bucket.requests, bucket.tokens + tokensToAdd);
      if (tokensToAdd > 0) bucket.lastRefill = now;
    }

    return bucket;
  }

  /**
   * Check if request can be made
   */
  canRequest(platform) {
    const bucket = this.refillBucket(platform);
    return bucket.tokens > 0;
  }

  /**
   * Consume a token (make a request)
   */
  consumeToken(platform) {
    const bucket = this.refillBucket(platform);
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }
    return false;
  }

  /**
   * Get wait time until next available token
   */
  getWaitTime(platform) {
    const bucket = this.getBucket(platform);
    if (bucket.tokens > 0) return 0;

    const refillRate = bucket.requests / bucket.windowMs;
    return Math.ceil(1 / refillRate);
  }

  /**
   * Execute with rate limiting
   */
  async execute(platform, fn) {
    // Initialize queue if needed
    if (!this.queues[platform]) {
      this.queues[platform] = [];
    }

    return new Promise((resolve, reject) => {
      this.queues[platform].push({ fn, resolve, reject });
      this.processQueue(platform);
    });
  }

  /**
   * Process queued requests
   */
  async processQueue(platform) {
    if (this.processing[platform]) return;
    this.processing[platform] = true;

    while (this.queues[platform] && this.queues[platform].length > 0) {
      if (!this.canRequest(platform)) {
        const waitTime = this.getWaitTime(platform);
        logger.info(`Rate limit: waiting ${waitTime}ms for ${platform}`);
        await this.sleep(waitTime);
        continue;
      }

      const { fn, resolve, reject } = this.queues[platform].shift();
      this.consumeToken(platform);

      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        // If rate limited by API, wait and retry
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || 60) * 1000;
          logger.warn(`API rate limit hit for ${platform}, waiting ${retryAfter}ms`);
          await this.sleep(retryAfter);
          // Re-queue the request
          this.queues[platform].unshift({ fn, resolve, reject });
        } else {
          reject(error);
        }
      }

      // Small delay between requests for politeness
      await this.sleep(100);
    }

    this.processing[platform] = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current status for all platforms
   */
  getStatus() {
    const status = {};
    for (const platform of Object.keys(this.limits)) {
      const bucket = this.buckets[platform];
      if (bucket) {
        status[platform] = {
          tokensRemaining: bucket.tokens,
          limit: bucket.requests,
          queueLength: (this.queues[platform] || []).length
        };
      }
    }
    return status;
  }
}

// Singleton instance
module.exports = new RateLimiter();
