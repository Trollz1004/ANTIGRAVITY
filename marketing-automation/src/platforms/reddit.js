/**
 * Reddit Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class RedditHandler extends BasePlatformHandler {
  constructor() {
    super('reddit', [
      'REDDIT_CLIENT_ID',
      'REDDIT_CLIENT_SECRET',
      'REDDIT_USERNAME',
      'REDDIT_PASSWORD'
    ]);
    this.accessToken = null;
    this.tokenExpiry = null;
    this.defaultSubreddit = process.env.REDDIT_DEFAULT_SUBREDDIT || 'test';
  }

  async authenticate() {
    logger.info('Reddit: Authenticating...');

    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'password',
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD
      }),
      {
        ...this.getAxiosConfig({
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }
    );

    if (!response.data?.access_token) {
      throw new Error('Failed to obtain Reddit access token');
    }

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    const me = await axios.get('https://oauth.reddit.com/api/v1/me', {
      ...this.getAxiosConfig({
        'Authorization': `Bearer ${this.accessToken}`
      })
    });

    logger.info(`Reddit: Authenticated as u/${me.data.name}`);
    this.authenticated = true;
    this.username = me.data.name;
    return this;
  }

  isTokenExpired() {
    return !this.tokenExpiry || Date.now() >= this.tokenExpiry - 60000;
  }

  async ensureAuthenticated() {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.authenticate();
    }
  }

  async _post(content, subreddit = null) {
    await this.ensureAuthenticated();

    const targetSubreddit = subreddit || this.defaultSubreddit;

    const response = await axios.post(
      'https://oauth.reddit.com/api/submit',
      new URLSearchParams({
        sr: targetSubreddit,
        kind: 'self',
        title: content.substring(0, 300),
        text: content,
        api_type: 'json'
      }),
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }
    );

    const data = this.extractResponseData(response, 'data.json.data', {});

    if (response.data?.json?.errors?.length > 0) {
      throw new Error(`Reddit API error: ${JSON.stringify(response.data.json.errors)}`);
    }

    const result = {
      id: data.id || data.name,
      url: data.url || `https://reddit.com/r/${targetSubreddit}`,
      platform: this.platform,
      subreddit: targetSubreddit
    };

    logger.info('Reddit: Posted successfully', { id: result.id, subreddit: targetSubreddit });
    return result;
  }

  async _getAnalytics(postId) {
    await this.ensureAuthenticated();

    const response = await axios.get(
      `https://oauth.reddit.com/api/info?id=t3_${postId}`,
      {
        ...this.getAxiosConfig({
          'Authorization': `Bearer ${this.accessToken}`
        })
      }
    );

    const post = response.data?.data?.children?.[0]?.data || {};
    return {
      upvotes: post.ups || 0,
      downvotes: post.downs || 0,
      score: post.score || 0,
      comments: post.num_comments || 0,
      ratio: post.upvote_ratio || 0
    };
  }
}

module.exports = new RedditHandler();
