/**
 * Input Validation Utilities
 * Opus Platform - Production Grade
 */

const { ValidationError } = require('./error-handler');

// Platform character limits
const CHAR_LIMITS = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  reddit: 40000,
  discord: 2000,
  telegram: 4096,
  bluesky: 300,
  mastodon: 500,
  medium: 100000,
  devto: 100000,
  pinterest: 500,
  producthunt: 260,
  hashnode: 100000,
  threads: 500,
  youtube: 500,  // Community posts
  tiktok: 2200
};

/**
 * Validate content for a specific platform
 */
function validateContent(platform, content) {
  if (!content) {
    throw new ValidationError(platform, 'Content is required', 'content');
  }

  if (typeof content !== 'string') {
    throw new ValidationError(platform, 'Content must be a string', 'content');
  }

  const limit = CHAR_LIMITS[platform] || 5000;
  if (content.length > limit) {
    throw new ValidationError(
      platform,
      `Content exceeds ${limit} character limit (got ${content.length})`,
      'content'
    );
  }

  return true;
}

/**
 * Validate URL format
 */
function validateUrl(platform, url, fieldName = 'url') {
  if (!url) {
    throw new ValidationError(platform, `${fieldName} is required`, fieldName);
  }

  try {
    new URL(url);
  } catch {
    throw new ValidationError(platform, `Invalid ${fieldName} format`, fieldName);
  }

  return true;
}

/**
 * Validate required environment variables
 */
function validateEnvVars(platform, required) {
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new ValidationError(
      platform,
      `Missing required environment variables: ${missing.join(', ')}`,
      'env'
    );
  }

  return true;
}

/**
 * Sanitize content for safe posting
 */
function sanitizeContent(content) {
  if (!content) return '';

  return content
    .trim()
    .replace(/\x00/g, '')  // Remove null bytes
    .replace(/[\u200B-\u200D\uFEFF]/g, '');  // Remove zero-width chars
}

/**
 * Truncate content to platform limit with ellipsis
 */
function truncateContent(platform, content, suffix = '...') {
  const limit = CHAR_LIMITS[platform] || 5000;

  if (content.length <= limit) return content;

  return content.substring(0, limit - suffix.length) + suffix;
}

/**
 * Extract and validate hashtags
 */
function validateHashtags(content, minCount = 0, maxCount = 30) {
  const hashtags = content.match(/#\w+/g) || [];

  if (hashtags.length < minCount) {
    return {
      valid: false,
      message: `Content needs at least ${minCount} hashtags (found ${hashtags.length})`,
      hashtags
    };
  }

  if (hashtags.length > maxCount) {
    return {
      valid: false,
      message: `Content has too many hashtags: ${hashtags.length} (max ${maxCount})`,
      hashtags
    };
  }

  return { valid: true, hashtags };
}

/**
 * Validate content follows mandatory tagging rules
 */
function validateTaggingRules(platform, content) {
  // Platform-specific minimum hashtag requirements
  const minHashtags = {
    twitter: 1,
    instagram: 5,
    linkedin: 1,
    facebook: 0,
    tiktok: 1,
    default: 0
  };

  const min = minHashtags[platform] || minHashtags.default;
  const result = validateHashtags(content, min);

  if (!result.valid && min > 0) {
    throw new ValidationError(platform, result.message, 'hashtags');
  }

  return result;
}

module.exports = {
  CHAR_LIMITS,
  validateContent,
  validateUrl,
  validateEnvVars,
  sanitizeContent,
  truncateContent,
  validateHashtags,
  validateTaggingRules
};
