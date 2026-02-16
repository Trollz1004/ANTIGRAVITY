/**
 * Twitter/X Platform Handler
 * Opus Platform - Production Grade
 */

const { TwitterApi } = require('twitter-api-v2');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class TwitterHandler extends BasePlatformHandler {
  constructor() {
    super('twitter', [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET'
    ]);
    this.client = null;
  }

  async authenticate() {
    logger.info('Twitter: Authenticating...');

    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // Verify credentials
    const me = await this.client.v2.me();
    if (!me.data) {
      throw new Error('Failed to verify Twitter credentials');
    }

    logger.info(`Twitter: Authenticated as @${me.data.username}`);
    this.authenticated = true;
    this.userId = me.data.id;
    return this;
  }

  async _post(content) {
    if (!this.client) {
      await this.authenticate();
    }

    const tweet = await this.client.v2.tweet(content);

    if (!tweet.data?.id) {
      throw new Error('Tweet response missing ID');
    }

    const result = {
      id: tweet.data.id,
      url: `https://twitter.com/i/status/${tweet.data.id}`,
      platform: this.platform
    };

    logger.info(`Twitter: Posted successfully`, { id: result.id, url: result.url });
    return result;
  }

  async _getAnalytics(tweetId) {
    if (!this.client) {
      await this.authenticate();
    }

    const tweet = await this.client.v2.singleTweet(tweetId, {
      'tweet.fields': ['public_metrics', 'created_at']
    });

    if (!tweet.data) {
      return { error: 'Tweet not found or inaccessible' };
    }

    const metrics = tweet.data.public_metrics || {};
    return {
      impressions: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      retweets: metrics.retweet_count || 0,
      replies: metrics.reply_count || 0,
      quotes: metrics.quote_count || 0
    };
  }

  async healthCheck() {
    const base = await super.healthCheck();
    try {
      if (this.isReady()) {
        await this.authenticate();
        return { ...base, status: 'healthy', userId: this.userId };
      }
    } catch (error) {
      return { ...base, status: 'unhealthy', error: error.message };
    }
    return { ...base, status: 'not_configured' };
  }
}

module.exports = new TwitterHandler();
